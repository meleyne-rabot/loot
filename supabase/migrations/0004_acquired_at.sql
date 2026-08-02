-- Sépare la date d'acquisition (choisie manuellement, ex: date de fournée)
-- de created_at (toujours l'horodatage réel d'insertion, utilisé pour le tri
-- "derniers ajouts en premier" dans l'Inventaire).
alter table items add column if not exists acquired_at date;
