-- Supabase SQL Editor içinde çalıştırın. Hizmet anahtarı yalnızca Netlify ortam değişkenidir.
create table if not exists public.push_subscriptions (endpoint text primary key, token_hash text, p256dh text not null, auth text not null, city text not null, lat double precision, lon double precision, lead_minutes integer not null default 0, prayers text[] not null, updated_at timestamptz not null default now());
create table if not exists public.push_deliveries (endpoint text not null, day text not null, prayer text not null, lead_minutes integer not null, sent_at timestamptz not null default now(), primary key(endpoint, day, prayer, lead_minutes));
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
-- anon/authenticated için policy yok; yalnızca service_role erişebilir.
create index if not exists push_delivery_sent on public.push_deliveries(sent_at);

-- v3 kurulumuna sahip projeler için güvenli geçiş:
alter table public.push_subscriptions add column if not exists token_hash text;
