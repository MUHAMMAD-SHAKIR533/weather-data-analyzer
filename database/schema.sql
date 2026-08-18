create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  admin1 text,
  latitude numeric(8,5) not null,
  longitude numeric(8,5) not null,
  created_at timestamptz not null default now(),
  constraint locations_lat_lon_check check (latitude between -90 and 90 and longitude between -180 and 180),
  constraint locations_lat_lon_unique unique (latitude, longitude)
);

create index if not exists locations_name_lower_idx on public.locations (lower(name));

create table if not exists public.weather_records (
  id serial primary key,
  location_id uuid not null references public.locations (id) on delete cascade,
  date date not null,
  temperature numeric,
  temperature_min numeric,
  temperature_max numeric,
  humidity numeric,
  rainfall numeric,
  wind_speed numeric,
  weather_code integer not null,
  created_at timestamptz not null default now(),
  constraint weather_records_location_date_unique unique (location_id, date)
);

create index if not exists weather_records_location_date_idx
  on public.weather_records (location_id, date);

alter table public.locations enable row level security;
alter table public.weather_records enable row level security;

