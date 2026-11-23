-- Seu Comando · parte 4 (23/11/2026): vários intervalos por jornada, fuso horário, jornada que passa da meia-noite,
-- reconhecimento facial e checklists com horário (registro de cada etapa, justificativa depois do limite e foto tirada na hora).
-- Rode depois do schema-3.sql. Pode rodar de novo.

-- 1) Marcações: 0 entrada; 1 a 8 intervalos (ímpar = saída para o intervalo, par = volta); 9 saída.
--    Antes eram 0 a 3 (3 = saída). A conversão roda uma vez só.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'registros_ponto_tipo_check' and pg_get_constraintdef(oid) not like '%9%') then
    alter table public.registros_ponto drop constraint registros_ponto_tipo_check;
    update public.registros_ponto set tipo = 9 where tipo = 3;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'registros_ponto_tipo_check') then
    alter table public.registros_ponto add constraint registros_ponto_tipo_check check (tipo between 0 and 9);
  end if;
  if exists (select 1 from pg_constraint where conname = 'ajustes_ponto_tipo_check' and pg_get_constraintdef(oid) not like '%9%') then
    alter table public.ajustes_ponto drop constraint ajustes_ponto_tipo_check;
    alter table public.ajustes_ponto disable trigger antes_do_ajuste;
    update public.ajustes_ponto set tipo = 9 where tipo = 3;
    alter table public.ajustes_ponto enable trigger antes_do_ajuste;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ajustes_ponto_tipo_check') then
    alter table public.ajustes_ponto add constraint ajustes_ponto_tipo_check check (tipo between 0 and 9);
  end if;
end $$;

-- 2) Reconhecimento facial: resultado em cada marcação e o rosto cadastrado de cada pessoa
alter table public.registros_ponto add column if not exists rosto text check (rosto in ('confere', 'nao_confere', 'cadastro'));
alter table public.registros_ponto add column if not exists rosto_dist real;

create table if not exists public.rostos (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null check (char_length(pessoa_id) between 1 and 40),
  descritor real[] not null check (array_length(descritor, 1) = 128),
  foto text check (char_length(foto) <= 220),
  cadastrado_em timestamptz not null default now(),
  cadastrado_por uuid default auth.uid(),
  primary key (empresa_id, pessoa_id)
);
create or replace function public.antes_do_rosto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.cadastrado_em := now(); new.cadastrado_por := auth.uid();
  if new.foto is not null and (split_part(new.foto, '/', 1) <> new.empresa_id::text or split_part(new.foto, '/', 2) <> new.pessoa_id) then raise exception 'foto_invalida'; end if;
  return new;
end $$;
drop trigger if exists antes_do_rosto on public.rostos;
create trigger antes_do_rosto before insert on public.rostos for each row execute function public.antes_do_rosto();
alter table public.rostos enable row level security;
-- o contador não vê rostos (dado biométrico: só quem precisa para conferir o ponto)
drop policy if exists rosto_ler on public.rostos;
create policy rosto_ler on public.rostos for select to authenticated using (
  public.meu_papel(empresa_id) = 'empresa' or pessoa_id = public.minha_pessoa(empresa_id)
  or (public.meu_papel(empresa_id) = 'gerente' and 'ponto' = any (public.minhas_perms(empresa_id))));
drop policy if exists rosto_cadastrar on public.rostos;
create policy rosto_cadastrar on public.rostos for insert to authenticated with check (
  public.meu_papel(empresa_id) = 'empresa'
  or (public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id)));
drop policy if exists rosto_apagar on public.rostos;
create policy rosto_apagar on public.rostos for delete to authenticated using (public.meu_papel(empresa_id) = 'empresa');
grant select, insert, delete on public.rostos to authenticated;
grant all on public.rostos to service_role;

-- 3) Antes de gravar a marcação: fuso da pessoa (ou da empresa), jornada que passou da meia-noite,
--    foto, local e rosto conforme as regras da empresa. Hora e NSR continuam vindo do servidor.
create or replace function public.antes_do_ponto() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; tz text; hoje date; ent timestamptz; elat double precision; elng double precision; raio double precision; d double precision;
begin
  new.em := now(); new.user_id := auth.uid();
  select coalesce(e.dados -> 'empresa' -> 'ponto', '{}'::jsonb),
         coalesce(nullif((select p ->> 'fuso' from jsonb_array_elements(case when jsonb_typeof(e.dados -> 'pessoas') = 'array' then e.dados -> 'pessoas' else '[]'::jsonb end) p where p ->> 'id' = new.pessoa_id limit 1), ''),
                  nullif(e.dados -> 'empresa' ->> 'fuso', ''), 'America/Sao_Paulo')
    into cfg, tz from empresas e where e.id = new.empresa_id;
  begin hoje := (now() at time zone tz)::date; exception when others then tz := 'America/Sao_Paulo'; hoje := (now() at time zone tz)::date; end;
  -- O app indica o dia da jornada; o servidor só aceita "ontem" se a jornada começou ontem, há menos de 24 horas, e ainda não teve saída.
  if new.dia is distinct from hoje then
    if new.dia = hoje - 1 and new.tipo > 0 then
      select em into ent from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje - 1 and tipo = 0;
      if ent is null or ent < now() - interval '24 hours'
         or exists (select 1 from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje - 1 and tipo = 9) then
        new.dia := hoje;
      end if;
    else
      new.dia := hoje;
    end if;
  end if;
  perform pg_advisory_xact_lock(hashtext(new.empresa_id::text));
  select coalesce(max(nsr), 0) + 1 into new.nsr from registros_ponto where empresa_id = new.empresa_id;
  if coalesce((cfg ->> 'foto')::boolean, true) and new.foto is null then raise exception 'sem_foto'; end if;
  if coalesce((cfg ->> 'local')::boolean, true) and new.metodo = 'celular' and (new.lat is null or new.lng is null) then raise exception 'sem_local'; end if;
  if new.foto is not null and (split_part(new.foto, '/', 1) <> new.empresa_id::text or split_part(new.foto, '/', 2) <> new.pessoa_id or split_part(new.foto, '/', 3) <> 'ponto') then
    raise exception 'foto_invalida';
  end if;
  if coalesce((cfg ->> 'rosto')::boolean, false) then
    if new.rosto is null then raise exception 'sem_rosto'; end if;
    if new.rosto = 'nao_confere' and coalesce((cfg ->> 'rosto_bloquear')::boolean, true) then raise exception 'rosto_nao_confere'; end if;
    if new.rosto = 'cadastro' and exists (select 1 from rostos where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and cadastrado_em < now() - interval '5 minutes') then
      raise exception 'rosto_ja_cadastrado';
    end if;
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

-- 4) Ajuste de marcação: "dia até hoje" conferido no fuso mais adiantado do Brasil (Fernando de Noronha),
--    para quem está em outro fuso não receber "dia inválido" perto da meia-noite.
create or replace function public.antes_do_ajuste() returns trigger
language plpgsql security definer set search_path = public as $$
declare hoje date := (now() at time zone 'America/Noronha')::date;
begin
  if tg_op = 'INSERT' then
    new.pedido_por := auth.uid(); new.pedido_em := now();
    if new.dia > hoje or new.dia < hoje - 400 then raise exception 'dia_invalido'; end if;
    if new.registro_id is not null and not exists (select 1 from registros_ponto r where r.id = new.registro_id and r.empresa_id = new.empresa_id and r.pessoa_id = new.pessoa_id and r.dia = new.dia and r.tipo = new.tipo) then
      raise exception 'registro_invalido';
    end if;
    if new.status = 'aprovado' then new.decidido_por := auth.uid(); new.decidido_em := now(); else new.decidido_por := null; new.decidido_em := null; new.decidido_nome := null; new.resposta := null; end if;
  else
    if old.status <> 'pendente' then raise exception 'ja_decidido'; end if;
    new.empresa_id := old.empresa_id; new.pessoa_id := old.pessoa_id; new.dia := old.dia; new.tipo := old.tipo; new.acao := old.acao; new.hora := old.hora;
    new.registro_id := old.registro_id; new.motivo := old.motivo; new.pedido_por := old.pedido_por; new.pedido_nome := old.pedido_nome; new.pedido_em := old.pedido_em;
    new.decidido_por := auth.uid(); new.decidido_em := now();
    if new.status = 'recusado' and coalesce(char_length(trim(new.resposta)), 0) < 3 then raise exception 'resposta_obrigatoria'; end if;
  end if;
  return new;
end $$;

-- 5) Checklists: cada etapa marcada vira um registro do dia, com a hora do servidor e sem edição.
--    O modelo do checklist (etapas, abertura, limite e foto) fica no documento da empresa; o banco confere por ele.
--    Um ajuste só para o dia (checklists[].ajustes["AAAA-MM-DD"]) vale no lugar do modelo naquele dia.
create table if not exists public.checklist_registros (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  checklist_id text not null check (char_length(checklist_id) between 1 and 40),
  etapa_id text not null check (char_length(etapa_id) between 1 and 40),
  dia date not null default current_date,
  pessoa_id text check (char_length(pessoa_id) between 1 and 40),
  por_nome text check (char_length(por_nome) <= 80),
  em timestamptz not null default now(),
  atrasado boolean not null default false,
  justificativa text check (char_length(justificativa) <= 300),
  foto text check (char_length(foto) <= 220),
  user_id uuid default auth.uid()
);
create unique index if not exists checklist_registros_unico on public.checklist_registros (empresa_id, checklist_id, etapa_id, dia);
create index if not exists checklist_registros_busca on public.checklist_registros (empresa_id, dia desc);
create or replace function public.antes_do_checklist() returns trigger
language plpgsql security definer set search_path = public as $$
declare d jsonb; tz text; c jsonb; et jsonb; agora time; ini time; lim time; nm text; atraso boolean := false;
begin
  new.em := now(); new.user_id := auth.uid();
  select e.dados, coalesce(nullif(e.dados -> 'empresa' ->> 'fuso', ''), 'America/Sao_Paulo') into d, tz from empresas e where e.id = new.empresa_id;
  begin new.dia := (now() at time zone tz)::date; exception when others then tz := 'America/Sao_Paulo'; new.dia := (now() at time zone tz)::date; end;
  select x into c from jsonb_array_elements(case when jsonb_typeof(d -> 'checklists') = 'array' then d -> 'checklists' else '[]'::jsonb end) x where x ->> 'id' = new.checklist_id limit 1;
  if c is null then raise exception 'checklist_inexistente'; end if;
  -- ajuste só para o dia: vale o horário e as etapas do ajuste
  if jsonb_typeof(c -> 'ajustes' -> (new.dia::text)) = 'object' then
    c := c || jsonb_build_object('etapas', coalesce(c -> 'ajustes' -> (new.dia::text) -> 'etapas', c -> 'etapas'),
                                 'inicio', coalesce(c -> 'ajustes' -> (new.dia::text) ->> 'inicio', c ->> 'inicio'),
                                 'limite', coalesce(c -> 'ajustes' -> (new.dia::text) ->> 'limite', c ->> 'limite'));
  end if;
  select x into et from jsonb_array_elements(case when jsonb_typeof(c -> 'etapas') = 'array' then c -> 'etapas' else '[]'::jsonb end) x where x ->> 'id' = new.etapa_id limit 1;
  if et is null then raise exception 'etapa_inexistente'; end if;
  agora := (now() at time zone tz)::time;
  ini := case when coalesce(c ->> 'inicio', '') ~ '^\d\d:\d\d$' then (c ->> 'inicio')::time end;
  lim := case when coalesce(et ->> 'limite', '') ~ '^\d\d:\d\d$' then (et ->> 'limite')::time
              when coalesce(c ->> 'limite', '') ~ '^\d\d:\d\d$' then (c ->> 'limite')::time end;
  if ini is not null and lim is not null and lim < ini then
    atraso := agora > lim and agora < ini;                -- checklist que passa da meia-noite (ex.: fechamento 22:00 às 00:30)
  else
    if ini is not null and agora < ini then raise exception 'checklist_fechado'; end if;
    atraso := lim is not null and agora > lim;
  end if;
  new.atrasado := atraso;
  if atraso and coalesce(char_length(trim(new.justificativa)), 0) < 5 then raise exception 'justificativa_obrigatoria'; end if;
  if not atraso then new.justificativa := null; end if;
  if coalesce((et ->> 'foto')::boolean, false) and new.foto is null then raise exception 'etapa_sem_foto'; end if;
  if new.foto is not null and (split_part(new.foto, '/', 1) <> new.empresa_id::text or split_part(new.foto, '/', 3) <> 'checklists'
     or split_part(new.foto, '/', 2) <> coalesce(new.pessoa_id, 'empresa')) then
    raise exception 'foto_invalida';
  end if;
  if new.pessoa_id is not null then
    select p ->> 'nome' into nm from jsonb_array_elements(case when jsonb_typeof(d -> 'pessoas') = 'array' then d -> 'pessoas' else '[]'::jsonb end) p where p ->> 'id' = new.pessoa_id limit 1;
    new.por_nome := coalesce(left(nm, 80), new.por_nome);
  end if;
  return new;
end $$;
drop trigger if exists antes_do_checklist on public.checklist_registros;
create trigger antes_do_checklist before insert on public.checklist_registros for each row execute function public.antes_do_checklist();
alter table public.checklist_registros enable row level security;
-- quem é da empresa vê o andamento (a foto continua protegida pelas regras do depósito de arquivos)
drop policy if exists ck_ler on public.checklist_registros;
create policy ck_ler on public.checklist_registros for select to authenticated using (public.meu_papel(empresa_id) in ('empresa', 'funcionario', 'gerente'));
drop policy if exists ck_marcar on public.checklist_registros;
create policy ck_marcar on public.checklist_registros for insert to authenticated with check (
  (public.meu_papel(empresa_id) = 'empresa' and pessoa_id is null)
  or (public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id)));
drop policy if exists ck_desfazer on public.checklist_registros;
create policy ck_desfazer on public.checklist_registros for delete to authenticated using (public.meu_papel(empresa_id) = 'empresa');
grant select, insert, delete on public.checklist_registros to authenticated;
grant all on public.checklist_registros to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
