-- Ajout des champs commission et téléphone sur les malles.
-- commission_pct : % que tu gardes pour toi (0 = tu reverses tout, 20 = tu gardes 20%).
-- phone : numéro de la personne pour les virements Lydia/virement (usage futur).
alter table malles add column if not exists commission_pct integer default 0;
alter table malles add column if not exists phone text;
