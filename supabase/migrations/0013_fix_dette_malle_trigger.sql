-- Migration 0013 : trigger dette_malle bidirectionnel
-- Avant : seulement incrémentait (non-vendu → vendu). Si on repassait un article
-- en non-vendu, ou si on corrigeait le montant, la dette restait gonflée.

create or replace function fn_item_vendu_dette()
returns trigger language plpgsql as $$
begin
  -- 1. Retire l'ancienne contribution si l'article était vendu et change
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

  -- 2. Ajoute la nouvelle contribution si l'article devient (ou reste) vendu
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

-- Recalcul complet de la dette de toutes les malles depuis les données réelles
-- (corrige la dette déjà corrompue d'Ulysse et de toutes les autres)
update malles m
set dette_malle = coalesce((
  select sum(i.montant_a_reverser)
  from items i
  where i.malle_id = m.id
    and i.statut = 'vendu'
    and (i.reverse_paye is null or i.reverse_paye = false)
    and i.montant_a_reverser is not null
), 0);
