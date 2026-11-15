-- Seu Comando · banco de dados (Supabase / PostgreSQL)
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo: usa "if not exists" e "create or replace".
-- Senhas: ficam no Supabase Auth com hash bcrypt (nunca nesta base). Códigos de acesso: só o hash bcrypt (pgcrypto).
-- Isolamento: Row Level Security em todas as tabelas; cada pessoa só vê o que o papel dela permite.

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tabelas ----------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 80),
  tipo text not null default 'padaria' check (char_length(tipo) <= 20),
  codigo text not null unique,                       -- código de conexão (ex.: PAD-4821)
  dados jsonb not null default '{}'::jsonb,          -- estado completo do painel (só empresa e contador)
  versao integer not null default 1,                 -- controle de edição simultânea
  criado_por uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint dados_tamanho check (pg_column_size(dados) < 5000000)
);

create table if not exists public.membros (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null check (papel in ('empresa', 'contador', 'gerente', 'funcionario')),
  pessoa_id text,                                    -- id da pessoa no documento (funcionário ou gerente)
  permissoes text[] not null default '{}',           -- permissões do gerente (ex.: banco, ponto)
  nome text,
  criado_em timestamptz not null default now(),
  primary key (empresa_id, user_id)
);
create index if not exists membros_user on public.membros (user_id);

create table if not exists public.convites (
  ref text primary key,                              -- parte pública do código (4 caracteres)
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  papel text not null check (papel in ('contador', 'gerente', 'funcionario')),
  pessoa_id text,
  cpf text check (cpf is null or cpf ~ '^[0-9]{11}$'),
  nome text,
  segredo_hash text not null,                        -- bcrypt da parte secreta
  tentativas integer not null default 0,
  expira_em timestamptz not null default now() + interval '72 hours',
  usado_em timestamptz,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);

create table if not exists public.docs_funcionario (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null,
  dados jsonb not null,                              -- só o que é do funcionário
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id, pessoa_id)
);

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null,
  user_id uuid not null default auth.uid(),
  ops jsonb not null check (pg_column_size(ops) < 200000),   -- ponto, atestado, checklist, curso, temperatura...
  criado_em timestamptz not null default now(),              -- data e hora do servidor (registro do ponto)
  aplicado_em timestamptz,
  resultado text
);
create index if not exists eventos_pendentes on public.eventos (empresa_id) where aplicado_em is null;

create table if not exists public.candidaturas (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  vaga_id text not null check (char_length(vaga_id) <= 40),
  dados jsonb not null check (pg_column_size(dados) < 20000),
  criado_em timestamptz not null default now(),
  importado_em timestamptz
);
create index if not exists candidaturas_pendentes on public.candidaturas (empresa_id) where importado_em is null;

create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  de_empresa uuid not null references public.empresas(id) on delete cascade,
  de_nome text not null,
  para_codigo text not null,
  dados jsonb not null check (pg_column_size(dados) < 50000),
  status text not null default 'enviado' check (status in ('enviado', 'aprovado', 'recusado')),
  motivo text check (motivo is null or char_length(motivo) <= 120),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz
);
create index if not exists envios_para on public.envios (para_codigo);

-- Registro de alterações (só cresce: ninguém edita nem apaga pelo app)
create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  autor uuid default auth.uid(),
  autor_nome text,
  acao text not null check (char_length(acao) <= 80),
  detalhe text check (char_length(detalhe) <= 400),
  em timestamptz not null default now()
);
create index if not exists auditoria_empresa on public.auditoria (empresa_id, em desc);

-- ---------- Funções de apoio (evitam recursão nas regras) ----------
create or replace function public.meu_papel(e uuid) returns text
language sql stable security definer set search_path = public as $$
  select papel from public.membros where empresa_id = e and user_id = auth.uid()
$$;
create or replace function public.minha_pessoa(e uuid) returns text
language sql stable security definer set search_path = public as $$
  select pessoa_id from public.membros where empresa_id = e and user_id = auth.uid()
$$;
create or replace function public.meus_codigos() returns setof text
language sql stable security definer set search_path = public as $$
  select e.codigo from public.empresas e join public.membros m on m.empresa_id = e.id
  where m.user_id = auth.uid() and m.papel = 'empresa'
$$;

-- ---------- Regras de acesso (RLS) ----------
alter table public.empresas enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.docs_funcionario enable row level security;
alter table public.eventos enable row level security;
alter table public.candidaturas enable row level security;
alter table public.envios enable row level security;
alter table public.auditoria enable row level security;

drop policy if exists empresas_ler on public.empresas;
create policy empresas_ler on public.empresas for select to authenticated using (public.meu_papel(id) in ('empresa', 'contador'));
drop policy if exists empresas_editar on public.empresas;
create policy empresas_editar on public.empresas for update to authenticated using (public.meu_papel(id) in ('empresa', 'contador')) with check (public.meu_papel(id) in ('empresa', 'contador'));

drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros for select to authenticated using (user_id = auth.uid() or public.meu_papel(empresa_id) = 'empresa');
drop policy if exists membros_remover on public.membros;
create policy membros_remover on public.membros for delete to authenticated using (public.meu_papel(empresa_id) = 'empresa' and papel <> 'empresa');

drop policy if exists convites_ler on public.convites;
create policy convites_ler on public.convites for select to authenticated using (public.meu_papel(empresa_id) = 'empresa');
drop policy if exists convites_remover on public.convites;
create policy convites_remover on public.convites for delete to authenticated using (public.meu_papel(empresa_id) = 'empresa');

drop policy if exists docs_ler on public.docs_funcionario;
create policy docs_ler on public.docs_funcionario for select to authenticated using (
  public.meu_papel(empresa_id) in ('empresa', 'contador') or (public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id)));
drop policy if exists docs_gravar on public.docs_funcionario;
create policy docs_gravar on public.docs_funcionario for insert to authenticated with check (public.meu_papel(empresa_id) in ('empresa', 'contador'));
drop policy if exists docs_atualizar on public.docs_funcionario;
create policy docs_atualizar on public.docs_funcionario for update to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));
drop policy if exists docs_apagar on public.docs_funcionario;
create policy docs_apagar on public.docs_funcionario for delete to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));

drop policy if exists eventos_criar on public.eventos;
create policy eventos_criar on public.eventos for insert to authenticated with check (
  user_id = auth.uid() and public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id) and aplicado_em is null);
drop policy if exists eventos_ler on public.eventos;
create policy eventos_ler on public.eventos for select to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador') or user_id = auth.uid());
drop policy if exists eventos_marcar on public.eventos;
create policy eventos_marcar on public.eventos for update to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));

drop policy if exists cand_ler on public.candidaturas;
create policy cand_ler on public.candidaturas for select to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));
drop policy if exists cand_marcar on public.candidaturas;
create policy cand_marcar on public.candidaturas for update to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));

drop policy if exists auditoria_ler on public.auditoria;
create policy auditoria_ler on public.auditoria for select to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));
-- eventos: quem administra só pode marcar como aplicado; o conteúdo (ops) não muda
revoke update on public.eventos from anon, authenticated;
grant update (aplicado_em, resultado) on public.eventos to authenticated;

drop policy if exists envios_ler on public.envios;
create policy envios_ler on public.envios for select to authenticated using (
  public.meu_papel(de_empresa) in ('empresa', 'contador') or para_codigo in (select public.meus_codigos()));
drop policy if exists envios_criar on public.envios;
create policy envios_criar on public.envios for insert to authenticated with check (public.meu_papel(de_empresa) = 'empresa' and status = 'enviado');

-- ---------- Ações (RPC) ----------
-- Cria a empresa e coloca quem criou como dono. Limite de 5 empresas por conta.
create or replace function public.criar_empresa(p_nome text, p_tipo text, p_dados jsonb) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_cod text; v_pref text;
begin
  if auth.uid() is null then raise exception 'sem_login'; end if;
  if (select count(*) from public.empresas where criado_por = auth.uid()) >= 5 then raise exception 'limite_empresas'; end if;
  v_pref := upper(substr(regexp_replace(coalesce(p_tipo, 'emp'), '[^a-zA-Z]', '', 'g') || 'EMP', 1, 3));
  loop
    v_cod := v_pref || '-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    exit when not exists (select 1 from public.empresas where codigo = v_cod);
  end loop;
  insert into public.empresas (nome, tipo, codigo, dados, criado_por)
  values (trim(p_nome), coalesce(p_tipo, 'padaria'), v_cod, coalesce(p_dados, '{}'::jsonb) || jsonb_build_object('empresa', coalesce(p_dados->'empresa', '{}'::jsonb) || jsonb_build_object('codigo', v_cod)), auth.uid())
  returning id into v_id;
  insert into public.membros (empresa_id, user_id, papel, nome) values (v_id, auth.uid(), 'empresa', null);
  return v_id;
end $$;

-- Salva o documento da empresa. Se outra pessoa salvou antes, avisa (conflito_versao).
create or replace function public.salvar_dados(p_empresa uuid, p_dados jsonb, p_versao integer) returns integer
language plpgsql security invoker set search_path = public as $$
declare v_nova integer;
begin
  update public.empresas set dados = p_dados, versao = versao + 1, atualizado_em = now(),
    nome = coalesce(nullif(trim(p_dados->'empresa'->>'nome'), ''), nome)
  where id = p_empresa and versao = p_versao returning versao into v_nova;
  if v_nova is null then raise exception 'conflito_versao'; end if;
  return v_nova;
end $$;

-- Gera código de acesso (contador ou funcionário). Devolve o código em claro só nesta resposta.
create or replace function public.criar_convite(p_empresa uuid, p_papel text, p_pessoa text, p_cpf text, p_nome text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; v_ref text; v_seg text := ''; i int; b bytea;
begin
  if public.meu_papel(p_empresa) is distinct from 'empresa' then raise exception 'sem_permissao'; end if;
  if p_papel not in ('contador', 'gerente', 'funcionario') then raise exception 'papel_invalido'; end if;
  if p_papel in ('funcionario', 'gerente') and (p_cpf is null or regexp_replace(p_cpf, '\D', '', 'g') !~ '^[0-9]{11}$') then raise exception 'cpf_invalido'; end if;
  delete from public.convites where empresa_id = p_empresa and usado_em is null and (pessoa_id = p_pessoa or (p_papel = 'contador' and papel = 'contador' and nome = p_nome));
  loop
    b := gen_random_bytes(4); v_ref := '';
    for i in 0..3 loop v_ref := v_ref || substr(a, (get_byte(b, i) % 31) + 1, 1); end loop;
    exit when not exists (select 1 from public.convites where ref = v_ref);
  end loop;
  b := gen_random_bytes(6);
  for i in 0..5 loop v_seg := v_seg || substr(a, (get_byte(b, i) % 31) + 1, 1); end loop;
  insert into public.convites (ref, empresa_id, papel, pessoa_id, cpf, nome, segredo_hash)
  values (v_ref, p_empresa, p_papel, p_pessoa, nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), ''), p_nome, crypt(v_seg, gen_salt('bf', 8)));
  insert into public.auditoria (empresa_id, acao, detalhe) values (p_empresa, 'Código de acesso gerado', coalesce(p_nome, '') || ' (' || p_papel || ')');
  return v_ref || '-' || v_seg;
end $$;

-- Confere um código (uso interno e da função de primeiro acesso). Conta tentativas: 5 erros invalidam o código.
create or replace function public.conferir_convite(p_codigo text, p_cpf text) returns public.convites
language plpgsql security definer set search_path = public, extensions as $$
declare c public.convites; v_ref text; v_seg text;
begin
  v_ref := upper(split_part(trim(p_codigo), '-', 1)); v_seg := upper(split_part(trim(p_codigo), '-', 2));
  select * into c from public.convites where ref = v_ref for update;
  if c.ref is null or c.usado_em is not null or c.expira_em < now() or c.tentativas >= 5 then raise exception 'codigo_invalido'; end if;
  if c.segredo_hash <> crypt(v_seg, c.segredo_hash) or (c.papel in ('funcionario', 'gerente') and c.cpf is distinct from regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) then
    update public.convites set tentativas = tentativas + 1 where ref = v_ref;
    return null;
  end if;
  return c;
end $$;
revoke all on function public.conferir_convite(text, text) from public, anon, authenticated;

-- Quem já tem conta aceita o código (contador com e-mail, ou funcionário que já tem login).
create or replace function public.aceitar_convite(p_codigo text, p_cpf text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare c public.convites;
begin
  if auth.uid() is null then raise exception 'sem_login'; end if;
  c := public.conferir_convite(p_codigo, p_cpf);
  if c.ref is null then raise exception 'codigo_invalido'; end if;
  insert into public.membros (empresa_id, user_id, papel, pessoa_id, nome) values (c.empresa_id, auth.uid(), c.papel, c.pessoa_id, c.nome)
  on conflict (empresa_id, user_id) do update set papel = excluded.papel, pessoa_id = excluded.pessoa_id, nome = excluded.nome;
  update public.convites set usado_em = now() where ref = c.ref;
  insert into public.auditoria (empresa_id, autor, acao, detalhe) values (c.empresa_id, auth.uid(), 'Acesso ativado', coalesce(c.nome, '') || ' (' || c.papel || ')');
  return c.empresa_id;
end $$;

-- Pré-entrevista: o candidato (sem login) só vê o título da vaga e manda as respostas.
create or replace function public.vaga_publica(p_codigo text, p_vaga text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('empresa', coalesce(e.dados->'empresa'->>'nome', e.nome), 'tipo', e.tipo,
    'vaga', jsonb_build_object('id', v->'id', 'titulo', v->'titulo', 'cargo', v->'cargo', 'regimeOferta', v->'regimeOferta', 'cliente', v->'cliente'), 'cliente',
    (select c->>'nome' from jsonb_array_elements(coalesce(e.dados->'clientes', '[]'::jsonb)) c where c->>'id' = v->>'cliente' limit 1))
  from public.empresas e, jsonb_array_elements(coalesce(e.dados->'vagas', '[]'::jsonb)) v
  where e.codigo = upper(p_codigo) and v->>'id' = p_vaga and coalesce((v->>'aberta')::boolean, true)
  limit 1
$$;
create or replace function public.enviar_candidatura(p_codigo text, p_vaga text, p_dados jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_emp uuid;
begin
  select id into v_emp from public.empresas where codigo = upper(p_codigo);
  if v_emp is null or public.vaga_publica(p_codigo, p_vaga) is null then raise exception 'vaga_inexistente'; end if;
  if (select count(*) from public.candidaturas where empresa_id = v_emp and criado_em > now() - interval '10 minutes') >= 200 then raise exception 'muitas_respostas'; end if;
  insert into public.candidaturas (empresa_id, vaga_id, dados) values (v_emp, p_vaga, p_dados);
end $$;

-- Empresa cliente decide sobre candidato enviado pela recrutadora.
create or replace function public.decidir_envio(p_id uuid, p_status text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('aprovado', 'recusado') then raise exception 'status_invalido'; end if;
  update public.envios set status = p_status, motivo = left(p_motivo, 120), decidido_em = now()
  where id = p_id and status = 'enviado' and para_codigo in (select public.meus_codigos());
  if not found then raise exception 'sem_permissao'; end if;
end $$;

-- O dono muda o que a pessoa é no app (funcionário, gerente, sem acesso) e as permissões. Fica registrado.
create or replace function public.alterar_acesso(p_empresa uuid, p_pessoa text, p_papel text, p_permissoes text[], p_nome text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if public.meu_papel(p_empresa) is distinct from 'empresa' then raise exception 'sem_permissao'; end if;
  if p_papel = 'nenhum' then
    delete from public.membros where empresa_id = p_empresa and pessoa_id = p_pessoa and papel in ('funcionario', 'gerente');
    get diagnostics n = row_count;
    delete from public.docs_funcionario where empresa_id = p_empresa and pessoa_id = p_pessoa;
  elsif p_papel in ('funcionario', 'gerente') then
    update public.membros set papel = p_papel, permissoes = case when p_papel = 'gerente' then coalesce(p_permissoes, '{}') else '{}' end
    where empresa_id = p_empresa and pessoa_id = p_pessoa and papel in ('funcionario', 'gerente');
    get diagnostics n = row_count;
  else raise exception 'papel_invalido'; end if;
  insert into public.auditoria (empresa_id, acao, detalhe) values (p_empresa, 'Acesso alterado', coalesce(p_nome, p_pessoa) || ': ' || p_papel || coalesce(' (' || array_to_string(p_permissoes, ', ') || ')', ''));
  return n;
end $$;

-- Registro de alterações feito pelo app (banco de horas, cadastro etc.)
create or replace function public.registrar(p_empresa uuid, p_acao text, p_detalhe text, p_autor_nome text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.meu_papel(p_empresa) is null then raise exception 'sem_permissao'; end if;
  insert into public.auditoria (empresa_id, autor_nome, acao, detalhe) values (p_empresa, left(p_autor_nome, 80), left(p_acao, 80), left(p_detalhe, 400));
end $$;

-- Usado só pela função de primeiro acesso (chave de serviço)
create or replace function public.usuario_por_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;
revoke all on function public.usuario_por_email(text) from public, anon, authenticated;

-- Acesso às tabelas pela API (as regras de RLS acima decidem as linhas). Visitante sem login (anon) não lê tabela nenhuma.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.empresas, public.membros, public.convites, public.docs_funcionario, public.candidaturas, public.envios, public.auditoria to authenticated;
grant select, insert on public.eventos to authenticated;
grant update (aplicado_em, resultado) on public.eventos to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Permissões das funções
revoke all on function public.criar_empresa(text, text, jsonb), public.salvar_dados(uuid, jsonb, integer), public.criar_convite(uuid, text, text, text, text),
  public.aceitar_convite(text, text), public.decidir_envio(uuid, text, text), public.vaga_publica(text, text), public.enviar_candidatura(text, text, jsonb),
  public.alterar_acesso(uuid, text, text, text[], text), public.registrar(uuid, text, text, text) from public;
grant execute on function public.criar_empresa(text, text, jsonb), public.salvar_dados(uuid, jsonb, integer), public.criar_convite(uuid, text, text, text, text),
  public.aceitar_convite(text, text), public.decidir_envio(uuid, text, text), public.alterar_acesso(uuid, text, text, text[], text), public.registrar(uuid, text, text, text) to authenticated;
grant execute on function public.conferir_convite(text, text), public.usuario_por_email(text) to service_role;
grant execute on function public.vaga_publica(text, text), public.enviar_candidatura(text, text, jsonb) to anon, authenticated;
revoke execute on function public.criar_empresa(text, text, jsonb), public.salvar_dados(uuid, jsonb, integer), public.criar_convite(uuid, text, text, text, text), public.aceitar_convite(text, text), public.decidir_envio(uuid, text, text), public.alterar_acesso(uuid, text, text, text[], text), public.registrar(uuid, text, text, text) from anon;
