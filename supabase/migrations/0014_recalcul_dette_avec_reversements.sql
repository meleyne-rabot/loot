-- Migration 0014 : recalcul correct de la dette
-- 0013 avait recalculé depuis les articles mais oublié de soustraire
-- les reversements déjà enregistrés dans la table `reversements`.
--
-- Formule correcte :
--   dette = SUM(montant_a_reverser articles non reversés) - SUM(reversements faits)

update malles m
set dette_malle = greatest(0,
  coalesce((
    select sum(i.montant_a_reverser)
    from items i
    where i.malle_id = m.id
      and i.statut = 'vendu'
      and (i.reverse_paye is null or i.reverse_paye = false)
      and i.montant_a_reverser is not null
  ), 0)
  - coalesce((
    select sum(r.montant)
    from reversements r
    where r.malle_id = m.id
  ), 0)
);
