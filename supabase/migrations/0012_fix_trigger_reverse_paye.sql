-- Corrige le trigger fn_item_vendu_dette :
-- - Ne touche pas dette_malle si l'article est déjà marqué reverse_paye=true
-- - Gère aussi le cas d'un article marqué vendu alors qu'il était déjà payé (vente saisie après coup)

create or replace function fn_item_vendu_dette()
returns trigger language plpgsql as $$
begin
  -- Nouvel article vendu et non encore reversé
  if TG_OP = 'INSERT' and new.statut = 'vendu' and new.malle_id is not null
    and coalesce(new.reverse_paye, false) = false then
    update malles
    set dette_malle = dette_malle + coalesce(new.montant_a_reverser, 0)
    where id = new.malle_id;

  -- Article passé à vendu (était autre chose) et non encore reversé
  elsif TG_OP = 'UPDATE' and new.statut = 'vendu' and old.statut <> 'vendu'
    and new.malle_id is not null
    and coalesce(new.reverse_paye, false) = false then
    update malles
    set dette_malle = dette_malle + coalesce(new.montant_a_reverser, 0)
    where id = new.malle_id;

  -- Article vendu dé-vendu (annulation) et non encore reversé
  elsif TG_OP = 'UPDATE' and old.statut = 'vendu' and new.statut <> 'vendu'
    and new.malle_id is not null
    and coalesce(old.reverse_paye, false) = false then
    update malles
    set dette_malle = greatest(0, dette_malle - coalesce(old.montant_a_reverser, 0))
    where id = new.malle_id;

  -- Correction de prix sur article vendu NON encore reversé → ajuste la dette
  elsif TG_OP = 'UPDATE'
    and new.statut = 'vendu' and old.statut = 'vendu'
    and coalesce(new.reverse_paye, false) = false
    and (new.montant_a_reverser is distinct from old.montant_a_reverser)
    and new.malle_id is not null then
    update malles
    set dette_malle = dette_malle
      + coalesce(new.montant_a_reverser, 0)
      - coalesce(old.montant_a_reverser, 0)
    where id = new.malle_id;

  -- Dans tous les autres cas (article déjà reversé) → ne touche PAS dette_malle
  end if;
  return new;
end;
$$;
