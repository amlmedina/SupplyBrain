import { supabase, isDemoMode } from './supabase'

// ── Products ──
export async function fetchProducts() {
  if (isDemoMode) return { data: null, error: 'demo' }
  return supabase.from('products').select('*').order('nombre')
}

export async function upsertProducts(products, userId) {
  if (isDemoMode) return { error: 'demo' }
  const rows = products.map(p => ({
    user_id: userId,
    sku: p.sku,
    nombre: p.nombre,
    categoria: p.categoria || '',
    costo: parseFloat(p.costo) || 0,
    precio_venta: parseFloat(p.precio || p.precio_venta) || 0,
    stock_actual: parseInt(p.stock || p.stock_actual) || 0,
    lead_time: parseInt(p.lead_time || p.leadTime) || 7,
    proveedor: p.proveedor || '',
    moq: parseInt(p.moq) || 1,
  }))
  return supabase.from('products').upsert(rows, { onConflict: 'user_id,sku' })
}

export async function updateProductStock(productId, newStock) {
  if (isDemoMode) return { error: 'demo' }
  return supabase.from('products').update({ stock_actual: newStock, updated_at: new Date().toISOString() }).eq('id', productId)
}

// ── Sales ──
export async function fetchSales() {
  if (isDemoMode) return { data: null, error: 'demo' }
  return supabase.from('sales').select('*').order('fecha', { ascending: false })
}

export async function insertSales(sales, userId, productMap) {
  if (isDemoMode) return { error: 'demo' }
  const rows = sales.map(s => ({
    user_id: userId,
    product_id: productMap[s.sku] || null,
    sku: s.sku,
    fecha: s.fecha,
    cantidad: parseInt(s.cantidad) || 0,
    canal: s.canal || '',
    ingreso_total: parseFloat(s.ingreso_total) || null,
  })).filter(s => s.product_id)
  if (rows.length === 0) return { error: 'No matching SKUs found' }
  // Clear old sales first, then insert new
  await supabase.from('sales').delete().eq('user_id', userId)
  return supabase.from('sales').insert(rows)
}

// ── Analysis ──
export async function runAnalysis(userId) {
  if (isDemoMode) return { error: 'demo' }
  return supabase.rpc('run_analysis', { p_user_id: userId })
}

export async function fetchAnalysis() {
  if (isDemoMode) return { data: null, error: 'demo' }
  return supabase
    .from('analysis_results')
    .select('*, products!inner(sku, nombre, categoria, costo, precio_venta, stock_actual, lead_time, proveedor, moq)')
    .order('estado')
}

export async function fetchAlerts() {
  if (isDemoMode) return { data: null, error: 'demo' }
  return supabase.from('alerts').select('*').order('severidad').order('created_at', { ascending: false })
}

// ── User Settings ──
export async function fetchSettings(userId) {
  if (isDemoMode) return { data: null, error: 'demo' }
  return supabase.from('user_settings').select('*').eq('id', userId).single()
}

export async function updateSettings(userId, settings) {
  if (isDemoMode) return { error: 'demo' }
  return supabase.from('user_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', userId)
}
