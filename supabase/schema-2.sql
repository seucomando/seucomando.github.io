-- Seu Comando · parte 2 (18/11/2026): ponto com foto e localização, documentos do funcionário, holerites em PDF e arquivos.
-- Rode depois do schema.sql, no SQL Editor do Supabase. Pode rodar de novo: não apaga dados.

create or replace function public.minhas_perms(e uuid) returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(permissoes, '{}') from public.membros where empresa_id = e and user_id = auth.uid()
$$;

-- ---------- Ponto: cada marcação é uma linha que ninguém altera nem apaga ----------
create table if not exists public.registros_ponto (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null check (char_length(pessoa_id) between 1 and 40),
  user_id uuid default auth.uid(),
  tipo smallint not null check (tipo between 0 and 3),          -- 0 entrada, 1 saída para o intervalo, 2 volta, 3 saída
  dia date not null default current_date,                       -- definido pelo servidor (horário de Brasília)
  em timestamptz not null default now(),                        -- hora do servidor, não a do celular
  nsr bigint not null default 0,                                -- número sequencial do registro, por empresa
  metodo text not null default 'celular' check (metodo in ('celular', 'fixo')),
  foto text check (char_length(foto) <= 220),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  precisao real check (precisao >= 0),
  distancia real,
  fora_do_local boolean
);
create unique index if not exists registros_ponto_unico on public.registros_ponto (empresa_id, pessoa_id, dia, tipo);
create index if not exists registros_ponto_busca on public.registros_ponto (empresa_id, dia desc);

-- Antes de gravar: hora, dia e NSR do servidor; confere foto e local pelas regras que a empresa definiu.
create or replace function public.antes_do_ponto() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; hoje date; elat double precision; elng double precision; raio double precision; d double precision;
begin
  new.em := now(); new.user_id := auth.uid();
  hoje := (now() at time zone 'America/Sao_Paulo')::date; new.dia := hoje;
  -- jornada que passou da meia-noite: a marcação pertence ao dia em que começou
  if new.tipo > 0
     and not exists (select 1 from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje and tipo = 0)
     and exists (select 1 from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje - 1 and tipo = 0)
     and not exists (select 1 from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje - 1 and tipo = 3) then
    new.dia := hoje - 1;
  end if;
  perform pg_advisory_xact_lock(hashtext(new.empresa_id::text));
  select coalesce(max(nsr), 0) + 1 into new.nsr from registros_ponto where empresa_id = new.empresa_id;
  select coalesce(dados -> 'empresa' -> 'ponto', '{}'::jsonb) into cfg from empresas where id = new.empresa_id;
  if coalesce((cfg ->> 'foto')::boolean, true) and new.foto is null then raise exception 'sem_foto'; end if;
  if coalesce((cfg ->> 'local')::boolean, true) and new.metodo = 'celular' and (new.lat is null or new.lng is null) then raise exception 'sem_local'; end if;
  if new.foto is not null and (split_part(new.foto, '/', 1) <> new.empresa_id::text or split_part(new.foto, '/', 2) <> new.pessoa_id or split_part(new.foto, '/', 3) <> 'ponto') then
    raise exception 'foto_invalida';
  end if;
  new.distancia := null; new.fora_do_local := null;
  elat := (cfg ->> 'lat')::double precision; elng := (cfg ->> 'lng')::double precision; raio := coalesce((cfg ->> 'raio')::double precision, 200);
  if elat is not null and elng is not null and new.lat is not null and new.lng is not null then
    d := 2 * 6371000 * asin(sqrt(power(sin(radians(new.lat - elat) / 2), 2) + cos(radians(elat)) * cos(radians(new.lat)) * power(sin(radians(new.lng - elng) / 2), 2)));
    new.distancia := round(d::numeric);
    new.fora_do_local := d > raio + coalesce(new.precisao, 0);
    if new.fora_do_local and coalesce((cfg ->> 'bloquear')::boolean, false) then raise exception 'fora_do_local'; end if;
  end if;
  return new;
end $$;
drop trigger if exists antes_do_ponto on public.registros_ponto;
create trigger antes_do_ponto before insert on public.registros_ponto for each row execute function public.antes_do_ponto();

-- ---------- Documentos que o funcionário envia (RG, CTPS, comprovante de residência...) ----------
create table if not exists public.documentos_pessoa (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null check (char_length(pessoa_id) between 1 and 40),
  tipo text not null check (char_length(tipo) <= 30),
  arquivo text not null check (char_length(arquivo) <= 220),
  nome text check (char_length(nome) <= 120),
  status text not null default 'enviado' check (status in ('enviado', 'aprovado', 'recusado')),
  motivo text check (char_length(motivo) <= 200),
  enviado_por uuid default auth.uid(),
  enviado_em timestamptz not null default now(),
  decidido_em timestamptz,
  decidido_por text check (char_length(decidido_por) <= 80)
);
create index if not exists documentos_pessoa_busca on public.documentos_pessoa (empresa_id, pessoa_id);

-- ---------- Holerites em PDF (o contador envia, a empresa aprova, o funcionário recebe) ----------
create table if not exists public.holerites (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null check (char_length(pessoa_id) between 1 and 40),
  competencia text not null check (competencia ~ '^[0-9]{4}-[0-9]{2}$'),
  arquivo text not null check (char_length(arquivo) <= 220),
  liquido numeric(12, 2),
  status text not null default 'aguardando' check (status in ('aguardando', 'liberado')),
  enviado_por uuid default auth.uid(),
  enviado_em timestamptz not null default now(),
  liberado_em timestamptz,
  unique (empresa_id, pessoa_id, competencia)
);

-- ---------- Regras de acesso ----------
alter table public.registros_ponto enable row level security;
alter table public.documentos_pessoa enable row level security;
alter table public.holerites enable row level security;

drop policy if exists ponto_ler on public.registros_ponto;
create policy ponto_ler on public.registros_ponto for select to authenticated using (
  public.meu_papel(empresa_id) in ('empresa', 'contador') or pessoa_id = public.minha_pessoa(empresa_id)
  or (public.meu_papel(empresa_id) = 'gerente' and 'ponto' = any (public.minhas_perms(empresa_id))));
drop policy if exists ponto_marcar on public.registros_ponto;
create policy ponto_marcar on public.registros_ponto for insert to authenticated with check (
  public.meu_papel(empresa_id) = 'empresa'
  or (public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id)));

drop policy if exists docp_ler on public.documentos_pessoa;
create policy docp_ler on public.documentos_pessoa for select to authenticated using (
  public.meu_papel(empresa_id) in ('empresa', 'contador') or pessoa_id = public.minha_pessoa(empresa_id));
drop policy if exists docp_enviar on public.documentos_pessoa;
create policy docp_enviar on public.documentos_pessoa for insert to authenticated with check (
  split_part(arquivo, '/', 1) = empresa_id::text and split_part(arquivo, '/', 2) = pessoa_id and split_part(arquivo, '/', 3) = 'docs'
  and (public.meu_papel(empresa_id) in ('empresa', 'contador')
       or (public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id) and status = 'enviado' and decidido_em is null)));
drop policy if exists docp_decidir on public.documentos_pessoa;
create policy docp_decidir on public.documentos_pessoa for update to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador'));
drop policy if exists docp_apagar on public.documentos_pessoa;
create policy docp_apagar on public.documentos_pessoa for delete to authenticated using (
  public.meu_papel(empresa_id) in ('empresa', 'contador') or (pessoa_id = public.minha_pessoa(empresa_id) and status <> 'aprovado'));

drop policy if exists hol_ler on public.holerites;
create policy hol_ler on public.holerites for select to authenticated using (
  public.meu_papel(empresa_id) in ('empresa', 'contador') or (pessoa_id = public.minha_pessoa(empresa_id) and status = 'liberado'));
drop policy if exists hol_enviar on public.holerites;
create policy hol_enviar on public.holerites for insert to authenticated with check (
  public.meu_papel(empresa_id) in ('empresa', 'contador') and status = 'aguardando'
  and split_part(arquivo, '/', 1) = empresa_id::text and split_part(arquivo, '/', 2) = pessoa_id and split_part(arquivo, '/', 3) = 'holerites');
drop policy if exists hol_alterar on public.holerites;
create policy hol_alterar on public.holerites for update to authenticated
  using (public.meu_papel(empresa_id) in ('empresa', 'contador'))
  with check (status = 'aguardando' or public.meu_papel(empresa_id) = 'empresa');   -- só a empresa libera
drop policy if exists hol_apagar on public.holerites;
create policy hol_apagar on public.holerites for delete to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'contador') and status = 'aguardando');

grant select, insert on public.registros_ponto to authenticated;   -- sem update e sem delete: ponto não se altera
grant select, insert, delete on public.documentos_pessoa to authenticated;
grant update (status, motivo, decidido_em, decidido_por) on public.documentos_pessoa to authenticated;
grant select, insert, update, delete on public.holerites to authenticated;
grant all on public.registros_ponto, public.documentos_pessoa, public.holerites to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- ---------- Arquivos (Storage): pasta <empresa>/<pessoa>/<área>/arquivo ----------
-- Empresa e contador: tudo da empresa. Funcionário: só a própria pasta (holerite só depois de liberado).
create or replace function public.pode_arquivo(caminho text, acao text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare p text[] := string_to_array(caminho, '/'); e uuid; papel text; pessoa text;
begin
  if coalesce(array_length(p, 1), 0) < 4 then return false; end if;
  begin e := p[1]::uuid; exception when others then return false; end;
  papel := meu_papel(e);
  if papel is null then return false; end if;
  if papel in ('empresa', 'contador') then return true; end if;
  pessoa := minha_pessoa(e);
  if p[2] = pessoa then
    if acao = 'enviar' then return p[3] in ('ponto', 'docs', 'atestados', 'checklists'); end if;
    if acao = 'apagar' then return p[3] = 'docs'; end if;
    if p[3] = 'holerites' then
      return exists (select 1 from holerites h where h.empresa_id = e and h.pessoa_id = pessoa and h.arquivo = caminho and h.status = 'liberado');
    end if;
    return true;
  end if;
  if acao = 'ler' and papel = 'gerente' and p[3] in ('ponto', 'checklists') and 'ponto' = any (minhas_perms(e)) then return true; end if;
  return false;
end $$;
revoke all on function public.pode_arquivo(text, text), public.minhas_perms(uuid) from public, anon;
grant execute on function public.pode_arquivo(text, text), public.minhas_perms(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('arquivos', 'arquivos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists arquivos_ler on storage.objects;
create policy arquivos_ler on storage.objects for select to authenticated using (bucket_id = 'arquivos' and public.pode_arquivo(name, 'ler'));
drop policy if exists arquivos_enviar on storage.objects;
create policy arquivos_enviar on storage.objects for insert to authenticated with check (bucket_id = 'arquivos' and public.pode_arquivo(name, 'enviar'));
drop policy if exists arquivos_apagar on storage.objects;
create policy arquivos_apagar on storage.objects for delete to authenticated using (bucket_id = 'arquivos' and public.pode_arquivo(name, 'apagar'));
