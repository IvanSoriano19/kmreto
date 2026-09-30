-- Varios grupos por usuario.
--
-- Hasta ahora cada actividad pertenecía a un reto y cada usuario estaba en uno
-- solo. A partir de aquí la actividad es de la persona y cuenta en todos los
-- grupos en los que está, desde el día en que se unió, según las reglas de cada
-- grupo (fechas, deportes que cuentan, meta por persona y meta conjunta).
-- También sustituye las políticas "acceso total" por acceso por grupo.

-- ── 1. Datos de prueba ───────────────────────────────────────────────────────
-- Reto "pai" (código PP6NVL), sus actividades y el usuario de prueba "webo".
delete from public.actividades where reto_id in (select id from public.retos where codigo_invitacion = 'PP6NVL');
delete from public.reto_miembros where reto_id in (select id from public.retos where codigo_invitacion = 'PP6NVL');
delete from public.retos where codigo_invitacion = 'PP6NVL';
delete from public.actividades where user_id in (select id from auth.users where email = 'ivan@ivan.com');
delete from public.reto_miembros where user_id in (select id from auth.users where email = 'ivan@ivan.com');
delete from public.profiles where id in (select id from auth.users where email = 'ivan@ivan.com');
delete from auth.users where email = 'ivan@ivan.com';

-- ── 2. Reglas de cada grupo ──────────────────────────────────────────────────
alter table public.retos
  add column fecha_inicio date,
  add column fecha_fin date,
  add column objetivo_grupo_km integer,
  add column deportes text[];

update public.retos set fecha_inicio = make_date(year, 1, 1), fecha_fin = make_date(year, 12, 31);
update public.retos set fecha_inicio = '2025-12-25', fecha_fin = '2026-12-24' where nombre = 'De Valencia a Sanxenxo';

alter table public.retos
  alter column fecha_inicio set not null,
  alter column fecha_inicio set default current_date,
  alter column nombre set not null,
  alter column codigo_invitacion set not null,
  drop column year,
  add constraint retos_fechas_check check (fecha_fin is null or fecha_fin >= fecha_inicio),
  add constraint retos_objetivo_km_check check (objetivo_km > 0),
  add constraint retos_objetivo_grupo_km_check check (objetivo_grupo_km is null or objetivo_grupo_km > 0);

-- ── 3. Miembros: desde cuándo cuenta cada uno ────────────────────────────────
alter table public.reto_miembros add column unido_el date not null default current_date;
-- Los miembros actuales estaban desde el principio del reto.
update public.reto_miembros m set unido_el = r.fecha_inicio from public.retos r where r.id = m.reto_id;

-- La meta personal por grupo pasa a ser la meta global del perfil: ahora la
-- meta por persona la fija el grupo.
alter table public.profiles add column objetivo_km integer check (objetivo_km is null or objetivo_km > 0);
update public.profiles p set objetivo_km = m.objetivo_km
  from public.reto_miembros m where m.user_id = p.id and m.objetivo_km is not null;

alter table public.reto_miembros
  drop column objetivo_km,
  alter column reto_id set not null,
  alter column user_id set not null,
  drop constraint reto_miembros_reto_id_fkey,
  add constraint reto_miembros_reto_id_fkey foreign key (reto_id) references public.retos(id) on delete cascade,
  drop constraint reto_miembros_user_id_fkey,
  add constraint reto_miembros_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

create index if not exists reto_miembros_user_id_idx on public.reto_miembros (user_id);

-- ── 4. Actividades: de la persona, no del reto ───────────────────────────────
alter table public.actividades
  drop column reto_id,
  alter column user_id set not null,
  add constraint actividades_distancia_km_check check (distancia_km > 0),
  drop constraint actividades_user_id_fkey,
  add constraint actividades_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

create index if not exists actividades_user_id_fecha_idx on public.actividades (user_id, fecha);

-- ── 5. Qué actividades cuentan en cada grupo ─────────────────────────────────
-- Una fila por (actividad, grupo) en el que cuenta. security_invoker: se aplica
-- el RLS de quien consulta, así que solo devuelve grupos propios.
create view public.actividades_reto with (security_invoker = true) as
select a.id, a.user_id, a.deporte, a.distancia_km, a.fecha, a.nota, a.foto_url, a.created_at, m.reto_id
from public.actividades a
join public.reto_miembros m on m.user_id = a.user_id
join public.retos r on r.id = m.reto_id
where a.fecha >= greatest(r.fecha_inicio, m.unido_el)
  and (r.fecha_fin is null or a.fecha <= r.fecha_fin)
  and (r.deportes is null or cardinality(r.deportes) = 0 or a.deporte = any (r.deportes));

-- ── 6. Funciones auxiliares para el RLS ──────────────────────────────────────
-- security definer para que las políticas de reto_miembros no se llamen a sí
-- mismas en bucle.
create or replace function public.mis_retos()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select reto_id from public.reto_miembros where user_id = auth.uid()
$$;

create or replace function public.es_companero(otro uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.reto_miembros yo
    join public.reto_miembros el on el.reto_id = yo.reto_id
    where yo.user_id = auth.uid() and el.user_id = otro
  )
$$;

-- Entrar en un grupo con su código. Sin esto habría que dejar leer todos los
-- retos para poder buscar el código.
create or replace function public.unirse_con_codigo(codigo text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  reto uuid;
begin
  if auth.uid() is null then
    raise exception 'no_autenticado';
  end if;
  select id into reto from public.retos where codigo_invitacion = upper(trim(codigo));
  if reto is null then
    raise exception 'codigo_no_encontrado';
  end if;
  insert into public.reto_miembros (reto_id, user_id) values (reto, auth.uid())
  on conflict (reto_id, user_id) do nothing;
  return reto;
end
$$;

revoke execute on function public.mis_retos(), public.es_companero(uuid), public.unirse_con_codigo(text) from public, anon;
grant execute on function public.mis_retos(), public.es_companero(uuid), public.unirse_con_codigo(text) to authenticated;

-- ── 7. Perfil automático al registrarse ──────────────────────────────────────
-- Antes lo creaba la app tras el alta, pero falla si hay que confirmar el email
-- (aún no hay sesión) y con Google no se creaba hasta el onboarding.
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end
$$;

create trigger crear_perfil_al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- ── 8. Políticas ─────────────────────────────────────────────────────────────
drop policy if exists "Acceso retos" on public.retos;
drop policy if exists "Acceso miembros" on public.reto_miembros;
drop policy if exists "Acceso actividades" on public.actividades;
drop policy if exists "Ver perfiles del reto" on public.profiles;
drop policy if exists "Editar perfil propio" on public.profiles;
drop policy if exists "Insertar perfil propio" on public.profiles;

-- Retos: los ven sus miembros; los edita y borra quien los creó.
create policy "Ver mis grupos" on public.retos for select to authenticated
  using (id in (select public.mis_retos()) or creado_por = (select auth.uid()));
create policy "Crear grupos" on public.retos for insert to authenticated
  with check (creado_por = (select auth.uid()));
create policy "Editar mis grupos" on public.retos for update to authenticated
  using (creado_por = (select auth.uid())) with check (creado_por = (select auth.uid()));
create policy "Borrar mis grupos" on public.retos for delete to authenticated
  using (creado_por = (select auth.uid()));

-- Miembros: se ven entre compañeros de grupo. Quien crea un grupo se añade a
-- sí mismo; el resto entra con unirse_con_codigo(). Cada uno puede salirse.
create policy "Ver miembros de mis grupos" on public.reto_miembros for select to authenticated
  using (reto_id in (select public.mis_retos()));
create policy "Unirme a mi grupo nuevo" on public.reto_miembros for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and unido_el = current_date
    and exists (select 1 from public.retos r where r.id = reto_id and r.creado_por = (select auth.uid()))
  );
create policy "Salir de un grupo" on public.reto_miembros for delete to authenticated
  using (user_id = (select auth.uid()));

-- Actividades: las mías y las de mis compañeros de grupo; solo toco las mías.
create policy "Ver actividades propias y de compañeros" on public.actividades for select to authenticated
  using (user_id = (select auth.uid()) or public.es_companero(user_id));
create policy "Crear actividades propias" on public.actividades for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Editar actividades propias" on public.actividades for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Borrar actividades propias" on public.actividades for delete to authenticated
  using (user_id = (select auth.uid()));

-- Perfiles: el mío y los de mis compañeros.
create policy "Ver perfiles propios y de compañeros" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.es_companero(id));
create policy "Crear perfil propio" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Editar perfil propio" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Solo la usa el trigger de auth.users; no debe poder llamarse por la API.
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;

-- Km que lleva cada miembro en cada grupo, ya sumados en la base de datos (una
-- fila por miembro, también los que van a 0). Así la clasificación no depende
-- del límite de filas de la API aunque el grupo tenga miles de actividades.
create view public.km_por_miembro with (security_invoker = true) as
select m.reto_id, m.user_id, m.unido_el,
       coalesce(sum(v.distancia_km), 0) as km,
       count(v.id) as actividades
from public.reto_miembros m
left join public.actividades_reto v on v.reto_id = m.reto_id and v.user_id = m.user_id
group by m.reto_id, m.user_id, m.unido_el;
