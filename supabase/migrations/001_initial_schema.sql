-- ═══════════════════════════════════════════════════════════════
-- SUPPLY BRAIN — Database Schema
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. USER SETTINGS
create table public.user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa text not null default '',
  moneda text not null default 'MXN',
  dias_producto_muerto int not null default 60,
  lead_time_default int not null default 7,
  ciclo_compra int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
create policy "own_settings_select" on public.user_settings for select using (auth.uid() = id);
create policy "own_settings_insert" on public.user_settings for insert with check (auth.uid() = id);
create policy "own_settings_update" on public.user_settings for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (id, empresa)
  values (new.id, coalesce(new.raw_user_meta_data->>'empresa', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  nombre text not null,
  categoria text not null default '',
  costo numeric(12,2) not null default 0,
  precio_venta numeric(12,2) not null default 0,
  stock_actual int not null default 0,
  lead_time int not null default 7,
  proveedor text not null default '',
  moq int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, sku)
);
create index idx_products_user on public.products(user_id);
alter table public.products enable row level security;
create policy "own_products_select" on public.products for select using (auth.uid() = user_id);
create policy "own_products_insert" on public.products for insert with check (auth.uid() = user_id);
create policy "own_products_update" on public.products for update using (auth.uid() = user_id);
create policy "own_products_delete" on public.products for delete using (auth.uid() = user_id);

-- 3. SALES
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  sku text not null,
  fecha date not null,
  cantidad int not null default 0,
  canal text not null default '',
  ingreso_total numeric(12,2),
  created_at timestamptz not null default now()
);
create index idx_sales_user on public.sales(user_id);
create index idx_sales_product on public.sales(product_id);
alter table public.sales enable row level security;
create policy "own_sales_select" on public.sales for select using (auth.uid() = user_id);
create policy "own_sales_insert" on public.sales for insert with check (auth.uid() = user_id);
create policy "own_sales_delete" on public.sales for delete using (auth.uid() = user_id);

-- 4. ANALYSIS RESULTS
create table public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  total_vendido int not null default 0,
  rotacion_diaria numeric(10,4) not null default 0,
  dias_stock numeric(10,1),
  capital_atrapado numeric(12,2) not null default 0,
  dias_sin_venta int,
  es_producto_muerto boolean not null default false,
  abc_valor char(1) not null default 'C',
  abc_rotacion char(1) not null default 'C',
  stock_seguridad int not null default 0,
  punto_reorden int not null default 0,
  cantidad_reorden int not null default 0,
  costo_compra numeric(12,2) not null default 0,
  estado text not null default 'sano',
  fecha_compra text,
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create index idx_analysis_user on public.analysis_results(user_id);
alter table public.analysis_results enable row level security;
create policy "own_analysis_select" on public.analysis_results for select using (auth.uid() = user_id);
create policy "own_analysis_all" on public.analysis_results for all using (auth.uid() = user_id);

-- 5. ALERTS
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  sku text not null,
  nombre_producto text not null,
  tipo text not null,
  severidad text not null,
  mensaje text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_alerts_user on public.alerts(user_id);
alter table public.alerts enable row level security;
create policy "own_alerts_select" on public.alerts for select using (auth.uid() = user_id);
create policy "own_alerts_all" on public.alerts for all using (auth.uid() = user_id);

-- 6. ANALYSIS ENGINE (PostgreSQL function)
create or replace function public.run_analysis(p_user_id uuid)
returns void as $$
declare
  v_settings record;
  v_min_date date;
  v_total_days int;
  v_total_value numeric;
  v_cum_value numeric := 0;
  v_total_sold int;
  v_cum_sold int := 0;
  v_row record;
begin
  select * into v_settings from public.user_settings where id = p_user_id;
  if not found then return; end if;

  select coalesce(min(fecha), current_date) into v_min_date from public.sales where user_id = p_user_id;
  v_total_days := greatest(1, current_date - v_min_date);

  delete from public.analysis_results where user_id = p_user_id;
  delete from public.alerts where user_id = p_user_id;

  insert into public.analysis_results (user_id, product_id, total_vendido, rotacion_diaria, dias_stock, capital_atrapado, dias_sin_venta, es_producto_muerto)
  select p.user_id, p.id,
    coalesce(s.total_vendido, 0),
    coalesce(s.total_vendido::numeric / v_total_days, 0),
    case when coalesce(s.total_vendido, 0) > 0 then p.stock_actual::numeric / (s.total_vendido::numeric / v_total_days) else null end,
    p.stock_actual * p.costo,
    case when s.ultima_venta is not null then (current_date - s.ultima_venta)::int else null end,
    case when s.ultima_venta is null and p.stock_actual > 0 then true
         when s.ultima_venta is not null and (current_date - s.ultima_venta) >= v_settings.dias_producto_muerto then true
         else false end
  from public.products p
  left join (select product_id, sum(cantidad) as total_vendido, max(fecha) as ultima_venta from public.sales where user_id = p_user_id group by product_id) s on s.product_id = p.id
  where p.user_id = p_user_id;

  -- ABC by value
  select coalesce(sum(capital_atrapado), 0) into v_total_value from public.analysis_results where user_id = p_user_id;
  for v_row in (select id, capital_atrapado from public.analysis_results where user_id = p_user_id order by capital_atrapado desc) loop
    v_cum_value := v_cum_value + v_row.capital_atrapado;
    update public.analysis_results set abc_valor = case when v_total_value > 0 and v_cum_value <= v_total_value * 0.8 then 'A' when v_total_value > 0 and v_cum_value <= v_total_value * 0.95 then 'B' else 'C' end where id = v_row.id;
  end loop;

  -- ABC by rotation
  select coalesce(sum(total_vendido), 0) into v_total_sold from public.analysis_results where user_id = p_user_id;
  for v_row in (select id, total_vendido from public.analysis_results where user_id = p_user_id order by total_vendido desc) loop
    v_cum_sold := v_cum_sold + v_row.total_vendido;
    update public.analysis_results set abc_rotacion = case when v_total_sold > 0 and v_cum_sold <= v_total_sold * 0.8 then 'A' when v_total_sold > 0 and v_cum_sold <= v_total_sold * 0.95 then 'B' else 'C' end where id = v_row.id;
  end loop;

  -- Reorder calculations
  update public.analysis_results ar set
    stock_seguridad = ceil(ar.rotacion_diaria * (case ar.abc_rotacion when 'A' then 1.5 when 'B' then 1.0 else 0.5 end) * p.lead_time),
    punto_reorden = ceil(ar.rotacion_diaria * p.lead_time + ar.rotacion_diaria * (case ar.abc_rotacion when 'A' then 1.5 when 'B' then 1.0 else 0.5 end) * p.lead_time),
    cantidad_reorden = greatest(0, ceil(ar.rotacion_diaria * v_settings.ciclo_compra + ar.rotacion_diaria * (case ar.abc_rotacion when 'A' then 1.5 when 'B' then 1.0 else 0.5 end) * p.lead_time - p.stock_actual)),
    estado = case when p.stock_actual = 0 then 'sin_stock' when ar.es_producto_muerto then 'muerto' when ar.dias_stock is not null and ar.dias_stock <= p.lead_time then 'critico' when p.stock_actual <= ceil(ar.rotacion_diaria * p.lead_time + ar.rotacion_diaria * (case ar.abc_rotacion when 'A' then 1.5 when 'B' then 1.0 else 0.5 end) * p.lead_time) then 'alerta' when ar.dias_stock is not null and ar.dias_stock > v_settings.ciclo_compra * 3 then 'sobrestock' else 'sano' end
  from public.products p where ar.product_id = p.id and ar.user_id = p_user_id;

  -- Fix MOQ
  update public.analysis_results ar set cantidad_reorden = greatest(ar.cantidad_reorden, p.moq) from public.products p where ar.product_id = p.id and ar.user_id = p_user_id and ar.cantidad_reorden > 0 and ar.cantidad_reorden < p.moq;

  -- Costs and dates
  update public.analysis_results ar set costo_compra = ar.cantidad_reorden * p.costo from public.products p where ar.product_id = p.id and ar.user_id = p_user_id;
  update public.analysis_results ar set fecha_compra = case when ar.rotacion_diaria > 0 and ar.dias_stock is not null then case when (ar.dias_stock - p.lead_time - 3) < 0 then 'URGENTE' else (current_date + (ar.dias_stock - p.lead_time - 3)::int)::text end else null end from public.products p where ar.product_id = p.id and ar.user_id = p_user_id;

  -- Generate alerts
  insert into public.alerts (user_id, product_id, sku, nombre_producto, tipo, severidad, mensaje)
  select ar.user_id, ar.product_id, p.sku, p.nombre,
    case ar.estado when 'sin_stock' then 'sin_stock' when 'critico' then 'quiebre' when 'alerta' then 'reorden' when 'muerto' then 'muerto' when 'sobrestock' then 'sobrestock' else 'info' end,
    case ar.estado when 'sin_stock' then 'critico' when 'critico' then 'critico' when 'alerta' then 'alerta' when 'muerto' then 'info' when 'sobrestock' then 'bajo' else 'info' end,
    case ar.estado
      when 'sin_stock' then p.nombre || ': SIN STOCK.'
      when 'critico' then p.nombre || ': quedan ' || round(ar.dias_stock) || ' dias de stock.'
      when 'alerta' then p.nombre || ': quedan ' || round(ar.dias_stock) || ' dias. Comprar ' || ar.cantidad_reorden || ' uds.'
      when 'muerto' then p.nombre || ': sin ventas en ' || coalesce(ar.dias_sin_venta::text, '+60') || ' dias. $' || round(ar.capital_atrapado) || ' atrapado.'
      when 'sobrestock' then p.nombre || ': stock para ' || round(ar.dias_stock) || ' dias.'
      else '' end
  from public.analysis_results ar join public.products p on p.id = ar.product_id
  where ar.user_id = p_user_id and ar.estado in ('sin_stock','critico','alerta','muerto','sobrestock');
end;
$$ language plpgsql security definer;
