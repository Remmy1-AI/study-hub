-- ============================================================
-- Docket (mobile) + Ace catalogue — Yeboah Supabase project.
-- Additive and safe to re-run: create-if-not-exists, no table drops,
-- no row deletes. Seeds use ON CONFLICT DO NOTHING.
--
-- Catalogue tables mirror schema.sql + schema_programmes.sql +
-- schema_github_hybrid.sql + schema_r2_source.sql, with one change:
-- students sign in with phone OTP, so "authenticated" no longer means
-- "owner". Catalogue writes are gated on public.is_admin() instead.
-- Add the owner with:
--   insert into public.app_admins (user_id) values ('<auth user uuid>');
--
-- NEVER put the service_role key in client code or this repo.
-- ============================================================

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- admins ----------
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

drop policy if exists "admins_select_self" on public.app_admins;
create policy "admins_select_self"
  on public.app_admins for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins a where a.user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- programmes ----------
create table if not exists public.programmes (
  id text primary key,
  name text not null,
  short_name text,
  code text,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists programmes_sort_idx on public.programmes (sort_order, name);

drop trigger if exists programmes_set_updated_at on public.programmes;
create trigger programmes_set_updated_at
  before update on public.programmes
  for each row execute function public.set_updated_at();

comment on table public.programmes is
  'UMAT programmes / departments. Owner adds new ones from Admin.';

-- ---------- courses ----------
-- Optional explicit course list. Ace web uploads only set materials.course_code,
-- so clients also derive courses from distinct (department, course_code).
create table if not exists public.courses (
  id text primary key,
  programme_id text not null references public.programmes(id) on update cascade,
  code text not null,
  title text not null,
  level text,
  semester text,
  sort_order int not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists courses_programme_code_uidx on public.courses (programme_id, code);
create index if not exists courses_programme_idx on public.courses (programme_id, sort_order, code);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------- materials (Ace catalogue rows = Docket resources) ----------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  course_code text,
  department text,
  level text,
  material_type text,
  file_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  download_count int not null default 0,
  share_count int not null default 0,
  published boolean not null default true,
  source text not null default 'storage',
  external_url text,
  download_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id) on delete set null
);

alter table public.materials add column if not exists source text not null default 'storage';
alter table public.materials add column if not exists external_url text;
alter table public.materials add column if not exists download_url text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'materials_source_check') then
    alter table public.materials
      add constraint materials_source_check
      check (source in ('storage', 'github', 'external', 'r2'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'materials_material_type_check') then
    alter table public.materials
      add constraint materials_material_type_check
      check (material_type is null or material_type in (
        'slides','notes','past-questions','shared','tutorials','videos'
      ));
  end if;
end $$;

create index if not exists materials_published_idx on public.materials (published, created_at desc);
create index if not exists materials_course_code_idx on public.materials (course_code);
create index if not exists materials_department_idx on public.materials (department);
create index if not exists materials_source_idx on public.materials (source);
create index if not exists materials_type_idx on public.materials (material_type);
create unique index if not exists materials_file_path_uidx on public.materials (file_path);

drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

-- ---------- page_views (Ace admin dashboard) ----------
create table if not exists public.page_views (
  id bigserial primary key,
  path text not null,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);

-- ---------- catalogue RLS: public read, admin write ----------
alter table public.programmes enable row level security;
alter table public.courses enable row level security;
alter table public.materials enable row level security;
alter table public.page_views enable row level security;

grant select on public.programmes, public.courses, public.materials to anon, authenticated;
grant insert, update, delete on public.programmes, public.courses, public.materials to authenticated;
grant select, insert on public.page_views to anon, authenticated;

drop policy if exists "anon_select_programmes" on public.programmes;
create policy "anon_select_programmes"
  on public.programmes for select
  to anon, authenticated
  using (true);

drop policy if exists "admin_write_programmes" on public.programmes;
create policy "admin_write_programmes"
  on public.programmes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anon_select_published_courses" on public.courses;
create policy "anon_select_published_courses"
  on public.courses for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists "admin_write_courses" on public.courses;
create policy "admin_write_courses"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anon_select_published_materials" on public.materials;
create policy "anon_select_published_materials"
  on public.materials for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists "admin_write_materials" on public.materials;
create policy "admin_write_materials"
  on public.materials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anon_insert_page_views" on public.page_views;
create policy "anon_insert_page_views"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admin_select_page_views" on public.page_views;
create policy "admin_select_page_views"
  on public.page_views for select
  to authenticated
  using (public.is_admin());

-- ---------- catalogue RPCs ----------
create or replace function public.increment_download(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.materials
  set download_count = download_count + 1, updated_at = now()
  where id = p_id and published = true;
end;
$$;

create or replace function public.increment_share(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.materials
  set share_count = share_count + 1, updated_at = now()
  where id = p_id and published = true;
end;
$$;

create or replace function public.record_page_view(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.page_views (path)
  values (coalesce(nullif(trim(p_path), ''), '/'));
end;
$$;

create or replace function public.admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  select json_build_object(
    'visits', (select count(*)::bigint from public.page_views),
    'downloads', (select coalesce(sum(download_count), 0)::bigint from public.materials),
    'shares', (select coalesce(sum(share_count), 0)::bigint from public.materials),
    'materials', (select count(*)::bigint from public.materials)
  ) into result;
  return result;
end;
$$;

grant execute on function public.increment_download(uuid) to anon, authenticated;
grant execute on function public.increment_share(uuid) to anon, authenticated;
grant execute on function public.record_page_view(text) to anon, authenticated;
grant execute on function public.admin_stats() to authenticated;

-- ---------- storage bucket: materials (public read, admin write) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  true,
  52428800,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'image/jpeg',
    'image/png',
    'video/mp4'
  ]
)
on conflict (id) do nothing;

drop policy if exists "public_read_materials_storage" on storage.objects;
create policy "public_read_materials_storage"
  on storage.objects for select
  to public
  using (bucket_id = 'materials');

drop policy if exists "admin_insert_materials_storage" on storage.objects;
create policy "admin_insert_materials_storage"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materials' and public.is_admin());

drop policy if exists "admin_update_materials_storage" on storage.objects;
create policy "admin_update_materials_storage"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'materials' and public.is_admin())
  with check (bucket_id = 'materials' and public.is_admin());

drop policy if exists "admin_delete_materials_storage" on storage.objects;
create policy "admin_delete_materials_storage"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materials' and public.is_admin());

-- ---------- per-user: progress, bookmarks, downloads (owner-only) ----------
create table if not exists public.reading_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  page int not null default 1 check (page >= 1),
  total_pages int check (total_pages is null or total_pages >= 1),
  percent numeric(5,2) check (percent is null or (percent >= 0 and percent <= 100)),
  updated_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create index if not exists reading_progress_recent_idx on public.reading_progress (user_id, updated_at desc);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  page int not null default 1 check (page >= 1),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, material_id, page)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

create table if not exists public.downloads (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create index if not exists downloads_user_idx on public.downloads (user_id, downloaded_at desc);

drop trigger if exists reading_progress_set_updated_at on public.reading_progress;
create trigger reading_progress_set_updated_at
  before update on public.reading_progress
  for each row execute function public.set_updated_at();

alter table public.reading_progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.downloads enable row level security;

revoke all on public.reading_progress, public.bookmarks, public.downloads from anon;
grant select, insert, update, delete on public.reading_progress, public.bookmarks, public.downloads to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['reading_progress', 'bookmarks', 'downloads'] loop
    execute format('drop policy if exists "owner_select_%1$s" on public.%1$I', t);
    execute format(
      'create policy "owner_select_%1$s" on public.%1$I for select to authenticated using (user_id = auth.uid())', t);
    execute format('drop policy if exists "owner_insert_%1$s" on public.%1$I', t);
    execute format(
      'create policy "owner_insert_%1$s" on public.%1$I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "owner_update_%1$s" on public.%1$I', t);
    execute format(
      'create policy "owner_update_%1$s" on public.%1$I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "owner_delete_%1$s" on public.%1$I', t);
    execute format(
      'create policy "owner_delete_%1$s" on public.%1$I for delete to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- seed: UMAT programmes (same set as Ace js/data.js) ----------
insert into public.programmes (id, name, short_name, code, sort_order) values
  ('electrical', 'Electrical Engineering', 'Electrical', 'EE', 10),
  ('mechanical', 'Mechanical Engineering', 'Mechanical', 'ME', 20),
  ('petroleum', 'Petroleum Engineering', 'Petroleum', 'PE', 30),
  ('mining', 'Mining Engineering', 'Mining', 'MN', 40),
  ('geology', 'Geology', 'Geology', 'GL', 50),
  ('geomatics', 'Geomatics', 'Geomatics', 'GM', 60),
  ('logistics', 'Logistics and Transport', 'Logistics', 'LT', 70),
  ('computer-science', 'Computer Science', 'Computer Science', 'CS', 80),
  ('data-science', 'Data Science', 'Data Science', 'DS', 90),
  ('robotics-ai', 'Robotics and AI', 'Robotics & AI', 'RAI', 100),
  ('cyber-security', 'Cyber Security', 'Cyber Security', 'CYB', 110),
  ('information-systems', 'Information Systems', 'Info Systems', 'IS', 120),
  ('environmental-safety', 'Environmental and Safety', 'Env & Safety', 'ES', 130),
  ('land-administration', 'Land Administration', 'Land Admin', 'LA', 140),
  ('telecommunication', 'Telecommunication', 'Telecom', 'TC', 150),
  ('spatial-planning', 'Spatial Planning', 'Spatial Planning', 'SP', 160),
  ('minerals', 'Minerals Engineering', 'Minerals', 'MI', 170)
on conflict (id) do nothing;
