create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id,role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first user to sign up becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_first_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, description text,
  cover_image text, logo_image text, address text, maps_url text,
  instagram_url text, threads_url text, tiktok_url text,
  general_contact_url text,
  active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now());
grant select on public.stores to anon, authenticated; grant insert, update, delete on public.stores to authenticated; grant all on public.stores to service_role;
alter table public.stores enable row level security;
create policy "public read active stores" on public.stores for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write stores" on public.stores for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null, whatsapp_url text, wholesale_url text, retail_url text,
  active boolean not null default true, rotation_order int not null default 0,
  last_selected_at timestamptz, created_at timestamptz not null default now());
grant select, insert, update, delete on public.sellers to authenticated; grant all on public.sellers to service_role;
alter table public.sellers enable row level security;
create policy "admin all sellers" on public.sellers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.redirect_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null,
  action_type text not null, created_at timestamptz not null default now(),
  user_agent text, referrer text);
grant select on public.redirect_events to authenticated; grant all on public.redirect_events to service_role;
alter table public.redirect_events enable row level security;
create policy "admin read events" on public.redirect_events for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Atomic round-robin pick. Locks the store row to serialize concurrent picks.
create or replace function public.pick_seller(_slug text, _action text, _ua text, _ref text)
returns table(url text, fallback text) language plpgsql security definer set search_path=public as $$
declare s public.stores; sel public.sellers; target text;
begin
  if _action not in ('whatsapp','atacado','varejo') then raise exception 'invalid action'; end if;
  select * into s from public.stores where slug=_slug and active for update;
  if not found then return; end if;
  select * into sel from public.sellers
   where store_id=s.id and active
     and (case _action when 'whatsapp' then whatsapp_url when 'atacado' then wholesale_url else retail_url end) is not null
     and (case _action when 'whatsapp' then whatsapp_url when 'atacado' then wholesale_url else retail_url end) <> ''
   order by last_selected_at asc nulls first, rotation_order asc, created_at asc limit 1;
  if not found then
    insert into public.redirect_events(store_id, seller_id, action_type, user_agent, referrer) values (s.id, null, _action, _ua, _ref);
    return query select null::text, s.general_contact_url; return;
  end if;
  update public.sellers set last_selected_at = clock_timestamp() where id = sel.id;
  insert into public.redirect_events(store_id, seller_id, action_type, user_agent, referrer) values (s.id, sel.id, _action, _ua, _ref);
  target := case _action when 'whatsapp' then sel.whatsapp_url when 'atacado' then sel.wholesale_url else sel.retail_url end;
  return query select target, s.general_contact_url;
end $$;
revoke all on function public.pick_seller(text,text,text,text) from public;
grant execute on function public.pick_seller(text,text,text,text) to anon, authenticated, service_role;

insert into public.stores (name, slug, description, sort_order) values
('Caruaru','caruaru','Elegância em cada detalhe',1),
('Toritama','toritama','Elegância em cada detalhe',2),
('Santa Cruz Moda Center','santa-cruz-moda-center','Elegância em cada detalhe',3),
('Santa Cruz Centro','santa-cruz-centro','Elegância em cada detalhe',4),
('Palmares','palmares','Elegância em cada detalhe',5),
('Maceió','maceio','Elegância em cada detalhe',6);