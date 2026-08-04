-- Higher values appear first in storefront listings. Existing products retain
-- their current newest-first order until an admin changes their position.
alter table public.products
  add column if not exists display_rank integer not null default 0;

with ranked_products as (
  select id, row_number() over (order by created_at asc, id asc) as rank
  from public.products
)
update public.products as product
set display_rank = ranked_products.rank
from ranked_products
where product.id = ranked_products.id
  and product.display_rank = 0;

create index if not exists products_active_display_rank_idx
  on public.products (active, display_rank desc, created_at desc);
