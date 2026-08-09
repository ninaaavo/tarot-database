create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  arcana text not null,
  suit text,
  number integer,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.card_notes (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  category text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, category)
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  question text,
  overall_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.general_notes (
  id text primary key default 'general',
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.general_note_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Note',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_cards (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null references public.readings(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  position_name text not null,
  position_order integer not null default 1,
  orientation text not null default 'upright',
  interpretation text,
  created_at timestamptz not null default now(),
  constraint reading_cards_orientation_check check (orientation in ('upright', 'reversed'))
);

create index if not exists cards_name_idx on public.cards using gin (to_tsvector('simple', name));
create index if not exists card_notes_card_id_idx on public.card_notes (card_id);
create index if not exists readings_date_idx on public.readings (date desc);
create index if not exists reading_cards_reading_id_idx on public.reading_cards (reading_id, position_order);
create index if not exists reading_cards_card_id_idx on public.reading_cards (card_id);
create index if not exists general_note_entries_updated_at_idx on public.general_note_entries (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_card_notes_updated_at on public.card_notes;
create trigger set_card_notes_updated_at
before update on public.card_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_general_notes_updated_at on public.general_notes;
create trigger set_general_notes_updated_at
before update on public.general_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_general_note_entries_updated_at on public.general_note_entries;
create trigger set_general_note_entries_updated_at
before update on public.general_note_entries
for each row execute function public.set_updated_at();

-- MVP note: this project intentionally ignores auth. Leave RLS disabled while
-- developing, or add auth-specific policies before deploying a public app.
