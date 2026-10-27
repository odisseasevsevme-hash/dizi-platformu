-- Netflix tarzı kolaylıklar: arka plan görseli, fragman, türler, jeneriği atla, Listem

alter table public.titles add column if not exists backdrop_url text;      -- yatay (16:9) arka plan görseli
alter table public.titles add column if not exists trailer_uid text;       -- fragmanın Bunny video kimliği
alter table public.titles add column if not exists genres text[] not null default '{}';

alter table public.episodes add column if not exists intro_start_seconds int;
alter table public.episodes add column if not exists intro_end_seconds int;

create table if not exists public.my_list (
  user_id uuid not null references auth.users (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

alter table public.my_list enable row level security;

drop policy if exists "Kendi listesini oku" on public.my_list;
create policy "Kendi listesini oku" on public.my_list
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Kendi listesine ekle" on public.my_list;
create policy "Kendi listesine ekle" on public.my_list
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Kendi listesinden çıkar" on public.my_list;
create policy "Kendi listesinden çıkar" on public.my_list
  for delete to authenticated using (user_id = auth.uid());

-- Supabase API'nin yeni sütunları hemen tanıması için
notify pgrst, 'reload schema';
