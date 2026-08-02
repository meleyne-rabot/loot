-- Remplace la catégorie unique (category_id) par des tags cumulables.
-- La table `categories` est conservée telle quelle (renommée "Tags" côté UI
-- seulement) — chaque ligne devient un tag sélectionnable, plusieurs par item.
alter table items add column if not exists tag_ids uuid[] default '{}';
update items set tag_ids = array[category_id] where category_id is not null and tag_ids = '{}';
create index if not exists items_tag_ids_idx on items using gin (tag_ids);
