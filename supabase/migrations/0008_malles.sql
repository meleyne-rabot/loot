-- Table des Malles : sous-espaces de vente pour gérer les articles
-- d'un proche (enfants, amis, famille) séparément de ses propres stocks.
create table if not exists malles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nom text not null,
  description text,
  created_at timestamptz default now()
);

alter table malles enable row level security;
create policy "malles_user" on malles for all using (auth.uid() = user_id);

alter table items add column if not exists malle_id uuid references malles(id) on delete set null;
create index if not exists items_malle_id_idx on items(malle_id);
