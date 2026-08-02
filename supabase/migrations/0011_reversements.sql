-- Migration 0011 : dette portée au niveau Malle + table reversements

-- 1. Nouvelles colonnes sur malles
alter table malles add column if not exists dette_malle numeric default 0;
alter table malles add column if not exists paypal_me text;

-- 2. Initialisation : reprendre la dette des articles vendu non reversés
update malles m
set dette_malle = coalesce((
  select sum(i.montant_a_reverser)
  from items i
  where i.malle_id = m.id
    and i.statut = 'vendu'
    and (i.reverse_paye is null or i.reverse_paye = false)
    and i.montant_a_reverser is not null
), 0);

-- 3. Table reversements
create table if not exists reversements (
  id         uuid primary key default gen_random_uuid(),
  malle_id   uuid not null references malles(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  montant    numeric not null,
  date       date not null default current_date,
  methode    text not null default 'autre',
  note       text,
  created_at timestamptz not null default now()
);

alter table reversements enable row level security;

create policy "Users manage their own reversements"
  on reversements for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4. Trigger : incrémente dette_malle quand un article devient vendu
create or replace function fn_item_vendu_dette()
returns trigger language plpgsql as $$
begin
  if new.statut = 'vendu'
     and (TG_OP = 'INSERT' or old.statut <> 'vendu')
     and new.malle_id is not null
     and new.montant_a_reverser is not null
  then
    update malles
    set dette_malle = coalesce(dette_malle, 0) + new.montant_a_reverser
    where id = new.malle_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_item_vendu_dette_upd on items;
create trigger trg_item_vendu_dette_upd
  after update on items
  for each row execute function fn_item_vendu_dette();

drop trigger if exists trg_item_vendu_dette_ins on items;
create trigger trg_item_vendu_dette_ins
  after insert on items
  for each row execute function fn_item_vendu_dette();

-- 5. Trigger : décrémente dette_malle à chaque reversement
create or replace function fn_reversement_dette()
returns trigger language plpgsql as $$
begin
  update malles
  set dette_malle = greatest(0, coalesce(dette_malle, 0) - new.montant)
  where id = new.malle_id;
  return new;
end;
$$;

drop trigger if exists trg_reversement_dette on reversements;
create trigger trg_reversement_dette
  after insert on reversements
  for each row execute function fn_reversement_dette();
