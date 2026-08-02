-- Sources typées (personnel / dépôt-vente) avec commission
alter table sources add column if not exists type text not null default 'personnel' check (type in ('personnel', 'depot_vente'));
alter table sources add column if not exists commission_pct numeric not null default 0;

-- Catégories gérées par l'utilisatrice (remplace le champ texte libre items.categorie)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nom text not null,
  created_at timestamptz default now(),
  unique (user_id, nom)
);

alter table categories enable row level security;

create policy "categories_select_own" on categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on categories
  for delete using (auth.uid() = user_id);

-- Items : liaison vers sources/categories + suivi des reversements
alter table items add column if not exists source_id uuid references sources(id) on delete restrict;
alter table items add column if not exists category_id uuid references categories(id) on delete restrict;
alter table items add column if not exists commission_pct numeric;
alter table items add column if not exists montant_a_reverser numeric;
alter table items add column if not exists reverse_paye boolean not null default false;
alter table items add column if not exists date_reversement date;

create index if not exists items_source_id_idx on items (source_id);
create index if not exists items_category_id_idx on items (category_id);
create index if not exists items_reverse_paye_idx on items (reverse_paye);

-- Seed automatique des sources/catégories par défaut à la création d'un compte
create or replace function public.handle_new_user_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sources (user_id, name, type, commission_pct) values
    (new.id, 'Emmaüs', 'personnel', 0),
    (new.id, 'Vide-Grenier', 'personnel', 0),
    (new.id, 'Champigny', 'personnel', 0),
    (new.id, 'Autre', 'personnel', 0);

  insert into public.categories (user_id, nom) values
    (new.id, 'Jouets'),
    (new.id, 'Vêtements'),
    (new.id, 'Déco'),
    (new.id, 'Livres'),
    (new.id, 'Accessoires'),
    (new.id, 'Autre');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_defaults on auth.users;
create trigger on_auth_user_created_defaults
  after insert on auth.users
  for each row execute function public.handle_new_user_defaults();
