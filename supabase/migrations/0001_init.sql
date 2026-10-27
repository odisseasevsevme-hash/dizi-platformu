-- Dizi platformu: ilk şema
-- Supabase SQL Editor'da çalıştırın veya `supabase db push` kullanın.

-- Kullanıcı profilleri (yönetici bayrağı burada)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Yeni kayıt olan her kullanıcı için profil oluştur
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Filmler ve diziler
create table public.titles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('film', 'series')),
  name text not null,
  description text,
  year int,
  poster_url text,
  -- Sadece filmler için: Bunny Stream video kimliği
  video_uid text,
  created_at timestamptz not null default now(),
  constraint film_has_no_episodes check (kind = 'film' or video_uid is null)
);

-- Dizi bölümleri
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  season int not null check (season > 0),
  number int not null check (number > 0),
  name text,
  description text,
  video_uid text not null,
  created_at timestamptz not null default now(),
  unique (title_id, season, number)
);

create index episodes_title_idx on public.episodes (title_id, season, number);

-- Kaldığın yerden devam et
create table public.watch_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_uid text not null,
  position_seconds double precision not null default 0,
  duration_seconds double precision,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_uid)
);

-- Satır düzeyinde güvenlik
alter table public.profiles enable row level security;
alter table public.titles enable row level security;
alter table public.episodes enable row level security;
alter table public.watch_progress enable row level security;

create policy "Kendi profilini oku" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "Katalog herkese açık" on public.titles
  for select to anon, authenticated using (true);
create policy "Yönetici başlık ekler" on public.titles
  for insert to authenticated with check (public.is_admin());
create policy "Yönetici başlık günceller" on public.titles
  for update to authenticated using (public.is_admin());
create policy "Yönetici başlık siler" on public.titles
  for delete to authenticated using (public.is_admin());

create policy "Bölümler herkese açık" on public.episodes
  for select to anon, authenticated using (true);
create policy "Yönetici bölüm ekler" on public.episodes
  for insert to authenticated with check (public.is_admin());
create policy "Yönetici bölüm günceller" on public.episodes
  for update to authenticated using (public.is_admin());
create policy "Yönetici bölüm siler" on public.episodes
  for delete to authenticated using (public.is_admin());

create policy "Kendi izleme kaydını oku" on public.watch_progress
  for select to authenticated using (user_id = auth.uid());
create policy "Kendi izleme kaydını yaz" on public.watch_progress
  for insert to authenticated with check (user_id = auth.uid());
create policy "Kendi izleme kaydını güncelle" on public.watch_progress
  for update to authenticated using (user_id = auth.uid());

-- Kapak görselleri için herkese açık depolama alanı
insert into storage.buckets (id, name, public) values ('posters', 'posters', true);

create policy "Yönetici kapak yükler" on storage.objects
  for insert to authenticated with check (bucket_id = 'posters' and public.is_admin());
create policy "Yönetici kapak siler" on storage.objects
  for delete to authenticated using (bucket_id = 'posters' and public.is_admin());
