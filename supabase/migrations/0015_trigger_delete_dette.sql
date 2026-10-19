-- Migration 0015 : gestion du DELETE dans le trigger fn_item_vendu_dette
-- Avant : supprimer un article vendu ne décrémentait pas dette_malle.

create or replace function fn_item_vendu_dette()
returns trigger language plpgsql as $$
begin
  -- DELETE d'un article vendu : retire sa contribution
  if TG_OP = 'DELETE' then
    if old.statut = 'vendu'
       and old.malle_id is not null
       and old.montant_a_reverser is not null
       and coalesce(old.reverse_paye, false) = false
    then
      update malles
      set dette_malle = greatest(0, coalesce(dette_malle, 0) - old.montant_a_reverser)
      where id = old.malle_id;
    end if;
    return old;
  end if;

  -- UPDATE : retire l'ancienne contribution si l'article était vendu et change
  if TG_OP = 'UPDATE'
     and old.statut = 'vendu'
     and old.malle_id is not null
     and old.montant_a_reverser is not null
     and (new.statut <> 'vendu'
          or new.montant_a_reverser is distinct from old.montant_a_reverser
          or new.malle_id is distinct from old.malle_id)
  then
    update malles
    set dette_malle = greatest(0, coalesce(dette_malle, 0) - old.montant_a_reverser)
    where id = old.malle_id;
  end if;

  -- INSERT ou UPDATE : ajoute la nouvelle contribution si l'article devient (ou reste) vendu
  if new.statut = 'vendu'
     and new.malle_id is not null
     and new.montant_a_reverser is not null
     and (TG_OP = 'INSERT'
          or old.statut <> 'vendu'
          or new.montant_a_reverser is distinct from old.montant_a_reverser
          or new.malle_id is distinct from old.malle_id)
  then
    update malles
    set dette_malle = coalesce(dette_malle, 0) + new.montant_a_reverser
    where id = new.malle_id;
  end if;

  return new;
end;
$$;

-- Ajoute le trigger DELETE (INSERT et UPDATE existent déjà)
drop trigger if exists trg_item_vendu_dette_del on items;
create trigger trg_item_vendu_dette_del
  after delete on items
  for each row execute function fn_item_vendu_dette();

-- Recalcul immédiat de toutes les malles pour repartir sur une base propre
update malles m
set dette_malle = greatest(0, coalesce((
  select sum(i.montant_a_reverser)
  from items i
  where i.malle_id = m.id
    and i.statut = 'vendu'
    and (i.reverse_paye is null or i.reverse_paye = false)
    and i.montant_a_reverser is not null
), 0) - coalesce((
  select sum(r.montant)
  from reversements r
  where r.malle_id = m.id
), 0));
