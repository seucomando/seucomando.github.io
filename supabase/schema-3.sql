-- Seu Comando · parte 3 (18/11/2026): ajuste de marcação de ponto (tratamento), sem alterar o registro original.
-- Portaria MTP 671/2021: a marcação original continua no banco; o ajuste fica registrado à parte, com motivo, quem pediu e quem aprovou.
-- Rode depois do schema-2.sql. Pode rodar de novo.

create table if not exists public.ajustes_ponto (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  pessoa_id text not null check (char_length(pessoa_id) between 1 and 40),
  dia date not null,
  tipo smallint not null check (tipo between 0 and 3),
  acao text not null check (acao in ('incluir', 'corrigir', 'desconsiderar')),
  hora text check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  registro_id bigint references public.registros_ponto(id),
  motivo text not null check (char_length(motivo) between 5 and 300),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  pedido_por uuid default auth.uid(),
  pedido_nome text check (char_length(pedido_nome) <= 80),
  pedido_em timestamptz not null default now(),
  decidido_por uuid,
  decidido_nome text check (char_length(decidido_nome) <= 80),
  decidido_em timestamptz,
  resposta text check (char_length(resposta) <= 300),
  check (acao = 'desconsiderar' or hora is not null)
);
create index if not exists ajustes_ponto_busca on public.ajustes_ponto (empresa_id, dia desc);

create or replace function public.antes_do_ajuste() returns trigger
language plpgsql security definer set search_path = public as $$
declare hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if tg_op = 'INSERT' then
    new.pedido_por := auth.uid(); new.pedido_em := now();
    if new.dia > hoje or new.dia < hoje - 400 then raise exception 'dia_invalido'; end if;
    if new.registro_id is not null and not exists (select 1 from registros_ponto r where r.id = new.registro_id and r.empresa_id = new.empresa_id and r.pessoa_id = new.pessoa_id and r.dia = new.dia and r.tipo = new.tipo) then
      raise exception 'registro_invalido';
    end if;
    if new.status = 'aprovado' then new.decidido_por := auth.uid(); new.decidido_em := now(); else new.decidido_por := null; new.decidido_em := null; new.decidido_nome := null; new.resposta := null; end if;
  else
    -- só a decisão muda; o pedido fica como foi feito
    if old.status <> 'pendente' then raise exception 'ja_decidido'; end if;
    new.empresa_id := old.empresa_id; new.pessoa_id := old.pessoa_id; new.dia := old.dia; new.tipo := old.tipo; new.acao := old.acao; new.hora := old.hora;
    new.registro_id := old.registro_id; new.motivo := old.motivo; new.pedido_por := old.pedido_por; new.pedido_nome := old.pedido_nome; new.pedido_em := old.pedido_em;
    new.decidido_por := auth.uid(); new.decidido_em := now();
    if new.status = 'recusado' and coalesce(char_length(trim(new.resposta)), 0) < 3 then raise exception 'resposta_obrigatoria'; end if;
  end if;
  return new;
end $$;
drop trigger if exists antes_do_ajuste on public.ajustes_ponto;
create trigger antes_do_ajuste before insert or update on public.ajustes_ponto for each row execute function public.antes_do_ajuste();

alter table public.ajustes_ponto enable row level security;
drop policy if exists ajuste_ler on public.ajustes_ponto;
create policy ajuste_ler on public.ajustes_ponto for select to authenticated using (
  public.meu_papel(empresa_id) in ('empresa', 'contador') or pessoa_id = public.minha_pessoa(empresa_id)
  or (public.meu_papel(empresa_id) = 'gerente' and 'ponto' = any (public.minhas_perms(empresa_id))));
drop policy if exists ajuste_pedir on public.ajustes_ponto;
create policy ajuste_pedir on public.ajustes_ponto for insert to authenticated with check (
  public.meu_papel(empresa_id) = 'empresa'
  or (public.meu_papel(empresa_id) in ('funcionario', 'gerente') and pessoa_id = public.minha_pessoa(empresa_id) and status = 'pendente'));
drop policy if exists ajuste_decidir on public.ajustes_ponto;
create policy ajuste_decidir on public.ajustes_ponto for update to authenticated
  using (public.meu_papel(empresa_id) = 'empresa' and status = 'pendente')
  with check (status in ('aprovado', 'recusado'));
grant select, insert on public.ajustes_ponto to authenticated;
grant update (status, decidido_nome, resposta) on public.ajustes_ponto to authenticated;
grant all on public.ajustes_ponto to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Jornada que passou da meia-noite: só conta como "ainda aberta" até 16 horas depois da entrada.
-- Sem isso, quem esquece de marcar a saída começaria o dia seguinte dentro da jornada anterior.
create or replace function public.antes_do_ponto() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; hoje date; elat double precision; elng double precision; raio double precision; d double precision;
begin
  new.em := now(); new.user_id := auth.uid();
  hoje := (now() at time zone 'America/Sao_Paulo')::date; new.dia := hoje;
  if new.tipo > 0
     and not exists (select 1 from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje and tipo = 0)
     and exists (select 1 from registros_ponto where empresa_id = new.empresa_id and pessoa_id = new.pessoa_id and dia = hoje - 1 and tipo = 0 and em > now() - interval '16 hours')
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
