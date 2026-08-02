-- Sources de chine, propres à chaque utilisatrice (remplace le tableau SOURCES hardcodé)
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- Articles / annonces
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text,
  source text,
  description text,
  hashtags text[] default '{}',
  prix_achat numeric,
  prix_affiche numeric,
  prix_recommande numeric,
  prix_note text,
  prix_vente numeric,
  statut text not null default 'en-attente' check (statut in ('en-attente', 'en-vente', 'vendu')),
  plateformes text[] default '{}',
  categorie text,
  image text,
  created_at timestamptz default now()
);

create index if not exists items_user_id_idx on items (user_id);
create index if not exists items_statut_idx on items (statut);

alter table sources enable row level security;
alter table items enable row level security;

create policy "sources_select_own" on sources
  for select using (auth.uid() = user_id);
create policy "sources_insert_own" on sources
  for insert with check (auth.uid() = user_id);
create policy "sources_update_own" on sources
  for update using (auth.uid() = user_id);
create policy "sources_delete_own" on sources
  for delete using (auth.uid() = user_id);

create policy "items_select_own" on items
  for select using (auth.uid() = user_id);
create policy "items_insert_own" on items
  for insert with check (auth.uid() = user_id);
create policy "items_update_own" on items
  for update using (auth.uid() = user_id);
create policy "items_delete_own" on items
  for delete using (auth.uid() = user_id);
