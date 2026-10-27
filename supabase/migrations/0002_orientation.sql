-- Dizilerin ve filmlerin video yönü: yatay (16:9) veya dikey (9:16, kısa dizi tarzı)
alter table public.titles
  add column if not exists orientation text not null default 'horizontal'
  check (orientation in ('horizontal', 'vertical'));

-- Ana sayfadaki büyük afişte gösterilecek başlık
alter table public.titles
  add column if not exists featured boolean not null default false;

-- Supabase API'nin yeni sütunları hemen tanıması için
notify pgrst, 'reload schema';
