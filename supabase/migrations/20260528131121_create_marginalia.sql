-- Margin Notes: per-reader highlights + private notes on sutta passages.
-- Owner-only via RLS. Signed-out readers use localStorage and never touch this
-- table; a magic-link sign-in migrates their local marks up and syncs thereafter.

create table if not exists public.marginalia (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  slug       text not null,                 -- sutta slug
  locale     text not null default 'en',
  anchor     text not null,                 -- section id from textAnchor ('doc' if none)
  quote      text not null,
  prefix     text not null default '',
  suffix     text not null default '',
  note       text,                          -- null = highlight only; text = private note
  color      text not null default 'amber',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marginalia_user_page_idx
  on public.marginalia (user_id, slug, locale);

-- Notes get edited, so keep updated_at honest.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marginalia_set_updated_at on public.marginalia;
create trigger marginalia_set_updated_at
  before update on public.marginalia
  for each row execute function public.set_updated_at();

alter table public.marginalia enable row level security;

-- Owner-only. A signed-out reader has no auth.uid(), so no row is visible or
-- writable — the table is inert without authentication, exactly as intended.
drop policy if exists marginalia_select on public.marginalia;
create policy marginalia_select on public.marginalia
  for select using (auth.uid() = user_id);

drop policy if exists marginalia_insert on public.marginalia;
create policy marginalia_insert on public.marginalia
  for insert with check (auth.uid() = user_id);

drop policy if exists marginalia_update on public.marginalia;
create policy marginalia_update on public.marginalia
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists marginalia_delete on public.marginalia;
create policy marginalia_delete on public.marginalia
  for delete using (auth.uid() = user_id);
