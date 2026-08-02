alter table sources add column if not exists display_order integer;

update sources s set display_order = sub.rn
from (
  select id, row_number() over (partition by user_id order by name asc) as rn
  from sources
) sub
where s.id = sub.id and s.display_order is null;

alter table sources alter column display_order set default 0;
