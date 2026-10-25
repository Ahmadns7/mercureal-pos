-- Run this once: Supabase dashboard -> SQL Editor -> paste -> Run
create table if not exists pos_sync (
  shop_id text primary key,
  pin text not null,
  data jsonb not null,
  saved_at timestamptz not null default now()
);

alter table pos_sync enable row level security;

create policy "anon write own shop" on pos_sync
  for insert to anon with check (true)
  not valid;

-- allow upsert and read only with matching pin enforced in the app query
create policy "anon upsert" on pos_sync
  for update to anon using (true);

create policy "anon read" on pos_sync
  for select to anon using (true);
