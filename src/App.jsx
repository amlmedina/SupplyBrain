import { useState, useMemo, useCallback } from "react";
import * as Papa from "papaparse";

/* ════════════════════════════════════════════════════════════
   SUPPLY BRAIN MVP — Prototipo Funcional
   Features: Dashboard, Carga CSV, Clasificación ABC, 
   Motor de Recomendación, Alertas, Inventario completo
   ════════════════════════════════════════════════════════════ */

// ── Demo Data ──
const DEMO_PRODUCTS = [
  { sku: "COSM-001", nombre: "Crema facial de coco", categoria: "Cuidado facial", costo: 85, precio: 189, stock: 12, leadTime: 14, proveedor: "Naturex SA", moq: 12 },
  { sku: "COSM-002", nombre: "Sérum vitamina C", categoria: "Cuidado facial", costo: 120, precio: 299, stock: 45, leadTime: 10, proveedor: "Naturex SA", moq: 6 },
  { sku: "COSM-003", nombre: "Shampoo orgánico", categoria: "Cabello", costo: 65, precio: 149, stock: 3, leadTime: 7, proveedor: "BioClean", moq: 24 },
  { sku: "COSM-004", nombre: "Aceite esencial lavanda", categoria: "Aromaterapia", costo: 40, precio: 95, stock: 60, leadTime: 21, proveedor: "EsenciasPuras", moq: 10 },
  { sku: "COSM-005", nombre: "Jabón artesanal menta", categoria: "Cuerpo", costo: 25, precio: 59, stock: 150, leadTime: 5, proveedor: "BioClean", moq: 50 },
  { sku: "COSM-006", nombre: "Mascarilla de arcilla", categoria: "Cuidado facial", costo: 95, precio: 219, stock: 28, leadTime: 14, proveedor: "Naturex SA", moq: 6 },
  { sku: "COSM-007", nombre: "Protector solar SPF50", categoria: "Protecci\u00f3n", costo: 110, precio: 259, stock: 8, leadTime: 21, proveedor: "DermaLab", moq: 12 },
  { sku: "COSM-008", nombre: "Tónico facial rosas", categoria: "Cuidado facial", costo: 55, precio: 129, stock: 0, leadTime: 10, proveedor: "Naturex SA", moq: 12 },
  { sku: "COSM-009", nombre: "Bálsamo labial cereza", categoria: "Labios", costo: 18, precio: 45, stock: 200, leadTime: 5, proveedor: "BioClean", moq: 100 },
  { sku: "COSM-010", nombre: "Exfoliante corporal café", categoria: "Cuerpo", costo: 70, precio: 159, stock: 35, leadTime: 7, proveedor: "BioClean", moq: 12 },
];

const DEMO_SALES = [
  { sku: "COSM-001", fecha: "2026-01-15", cantidad: 3, canal: "Shopify" },
  { sku: "COSM-001", fecha: "2026-01-22", cantidad: 5, canal: "MercadoLibre" },
  { sku: "COSM-001", fecha: "2026-02-01", cantidad: 4, canal: "Shopify" },
  { sku: "COSM-001", fecha: "2026-02-14", cantidad: 6, canal: "Shopify" },
  { sku: "COSM-001", fecha: "2026-03-01", cantidad: 3, canal: "MercadoLibre" },
  { sku: "COSM-002", fecha: "2026-01-10", cantidad: 2, canal: "Shopify" },
  { sku: "COSM-002", fecha: "2026-02-05", cantidad: 1, canal: "Shopify" },
  { sku: "COSM-002", fecha: "2026-03-10", cantidad: 1, canal: "Shopify" },
  { sku: "COSM-003", fecha: "2026-01-05", cantidad: 8, canal: "Shopify" },
  { sku: "COSM-003", fecha: "2026-01-18", cantidad: 10, canal: "MercadoLibre" },
  { sku: "COSM-003", fecha: "2026-02-02", cantidad: 7, canal: "Shopify" },
  { sku: "COSM-003", fecha: "2026-02-20", cantidad: 9, canal: "Shopify" },
  { sku: "COSM-003", fecha: "2026-03-05", cantidad: 12, canal: "MercadoLibre" },
  { sku: "COSM-003", fecha: "2026-03-18", cantidad: 8, canal: "Shopify" },
  { sku: "COSM-005", fecha: "2026-01-12", cantidad: 2, canal: "Shopify" },
  { sku: "COSM-005", fecha: "2026-03-01", cantidad: 1, canal: "Shopify" },
  { sku: "COSM-006", fecha: "2026-01-20", cantidad: 3, canal: "Shopify" },
  { sku: "COSM-006", fecha: "2026-02-10", cantidad: 4, canal: "MercadoLibre" },
  { sku: "COSM-006", fecha: "2026-03-05", cantidad: 2, canal: "Shopify" },
  { sku: "COSM-007", fecha: "2026-01-08", cantidad: 5, canal: "Shopify" },
  { sku: "COSM-007", fecha: "2026-01-25", cantidad: 7, canal: "MercadoLibre" },
  { sku: "COSM-007", fecha: "2026-02-12", cantidad: 6, canal: "Shopify" },
  { sku: "COSM-007", fecha: "2026-02-28", cantidad: 8, canal: "MercadoLibre" },
  { sku: "COSM-007", fecha: "2026-03-15", cantidad: 4, canal: "Shopify" },
  { sku: "COSM-009", fecha: "2026-02-01", cantidad: 1, canal: "Shopify" },
  { sku: "COSM-010", fecha: "2026-01-15", cantidad: 4, canal: "Shopify" },
  { sku: "COSM-010", fecha: "2026-02-10", cantidad: 3, canal: "MercadoLibre" },
  { sku: "COSM-010", fecha: "2026-03-08", cantidad: 5, canal: "Shopify" },
];

// ── Analysis Engine ──
function analyzeProducts(products, sales) {
  const now = new Date("2026-03-26");
  const salesBySku = {};
  sales.forEach(s => {
    if (!salesBySku[s.sku]) salesBySku[s.sku] = [];
    salesBySku[s.sku].push(s);
  });

  let minDate = now, maxDate = new Date("2020-01-01");
  sales.forEach(s => {
    const d = new Date(s.fecha);
    if (d < minDate) minDate = d;
    if (d > maxDate) maxDate = d;
  });
  const totalDays = Math.max(1, Math.ceil((now - minDate) / 86400000));
  const deadDays = 60;
  const purchaseCycle = 30;

  const analyzed = products.map(prod => {
    const mySales = salesBySku[prod.sku] || [];
    const totalSold = mySales.reduce((s, x) => s + x.cantidad, 0);
    const rotacionDiaria = totalSold / totalDays;
    const diasStock = rotacionDiaria > 0 ? prod.stock / rotacionDiaria : Infinity;
    const capitalAtrapado = prod.stock * prod.costo;

    const lastSaleDate = mySales.length > 0
      ? new Date(Math.max(...mySales.map(x => new Date(x.fecha).getTime())))
      : null;
    const daysSinceLastSale = lastSaleDate ? Math.ceil((now - lastSaleDate) / 86400000) : Infinity;
    const esProductoMuerto = daysSinceLastSale >= deadDays || (mySales.length === 0 && prod.stock > 0);

    return { ...prod, totalSold, rotacionDiaria, diasStock, capitalAtrapado, daysSinceLastSale, esProductoMuerto, mySales };
  });

  // ABC by value
  const sortedByValue = [...analyzed].sort((a, b) => b.capitalAtrapado - a.capitalAtrapado);
  const totalValue = sortedByValue.reduce((s, x) => s + x.capitalAtrapado, 0);
  let cumValue = 0;
  sortedByValue.forEach(p => {
    cumValue += p.capitalAtrapado;
    p.abcValor = cumValue <= totalValue * 0.8 ? "A" : cumValue <= totalValue * 0.95 ? "B" : "C";
  });

  // ABC by rotation
  const sortedByRot = [...analyzed].sort((a, b) => b.totalSold - a.totalSold);
  const totalSoldAll = sortedByRot.reduce((s, x) => s + x.totalSold, 0);
  let cumSold = 0;
  sortedByRot.forEach(p => {
    cumSold += p.totalSold;
    p.abcRotacion = totalSoldAll > 0 ? (cumSold <= totalSoldAll * 0.8 ? "A" : cumSold <= totalSoldAll * 0.95 ? "B" : "C") : "C";
  });

  // Merge ABC back
  const abcMap = {};
  sortedByValue.forEach(p => { abcMap[p.sku] = { abcValor: p.abcValor }; });
  sortedByRot.forEach(p => { abcMap[p.sku].abcRotacion = p.abcRotacion; });

  analyzed.forEach(p => {
    p.abcValor = abcMap[p.sku].abcValor;
    p.abcRotacion = abcMap[p.sku].abcRotacion;

    const safetyFactor = p.abcRotacion === "A" ? 1.5 : p.abcRotacion === "B" ? 1.0 : 0.5;
    p.stockSeguridad = Math.ceil(p.rotacionDiaria * safetyFactor * p.leadTime);
    p.puntoReorden = Math.ceil(p.rotacionDiaria * p.leadTime + p.stockSeguridad);
    const rawQty = Math.ceil(p.rotacionDiaria * purchaseCycle + p.stockSeguridad - p.stock);
    p.cantidadReorden = Math.max(rawQty, 0);
    if (p.cantidadReorden > 0 && p.cantidadReorden < p.moq) p.cantidadReorden = p.moq;

    if (p.stock === 0) p.estado = "sin_stock";
    else if (p.esProductoMuerto) p.estado = "muerto";
    else if (p.diasStock <= p.leadTime) p.estado = "critico";
    else if (p.stock <= p.puntoReorden) p.estado = "alerta";
    else if (p.diasStock > purchaseCycle * 3) p.estado = "sobrestock";
    else p.estado = "sano";

    const diasHastaCompra = p.rotacionDiaria > 0 ? Math.floor(p.diasStock - p.leadTime - 3) : null;
    p.fechaCompra = diasHastaCompra !== null && diasHastaCompra >= 0
      ? new Date(now.getTime() + diasHastaCompra * 86400000).toISOString().split("T")[0]
      : diasHastaCompra !== null && diasHastaCompra < 0 ? "URGENTE" : null;
    p.costoCompra = p.cantidadReorden * p.costo;
  });

  // Alerts
  const alerts = [];
  analyzed.forEach(p => {
    if (p.stock === 0) alerts.push({ sku: p.sku, nombre: p.nombre, tipo: "sin_stock", severidad: "critico", mensaje: `${p.nombre}: SIN STOCK. Pérdida directa de ventas.` });
    else if (p.estado === "critico") alerts.push({ sku: p.sku, nombre: p.nombre, tipo: "quiebre", severidad: "critico", mensaje: `${p.nombre}: quedan ${Math.round(p.diasStock)} días de stock. Sin compra inmediata, se agotará antes de que llegue el pedido.` });
    else if (p.estado === "alerta") alerts.push({ sku: p.sku, nombre: p.nombre, tipo: "reorden", severidad: "alerta", mensaje: `${p.nombre}: quedan ${Math.round(p.diasStock)} días. Sugiero comprar ${p.cantidadReorden} unidades.` });
    if (p.esProductoMuerto && p.stock > 0) alerts.push({ sku: p.sku, nombre: p.nombre, tipo: "muerto", severidad: "info", mensaje: `${p.nombre}: sin ventas en ${p.daysSinceLastSale === Infinity ? "+60" : p.daysSinceLastSale} días. $${p.capitalAtrapado.toLocaleString()} de capital atrapado.` });
    if (p.estado === "sobrestock") alerts.push({ sku: p.sku, nombre: p.nombre, tipo: "sobrestock", severidad: "bajo", mensaje: `${p.nombre}: stock para ${Math.round(p.diasStock)} días. Considere promoción o reubicar capital.` });
  });

  alerts.sort((a, b) => {
    const sev = { critico: 0, alerta: 1, info: 2, bajo: 3 };
    return sev[a.severidad] - sev[b.severidad];
  });

  const totalInventoryValue = analyzed.reduce((s, p) => s + p.capitalAtrapado, 0);
  const capitalMuerto = analyzed.filter(p => p.esProductoMuerto).reduce((s, p) => s + p.capitalAtrapado, 0);
  const capitalSano = totalInventoryValue - capitalMuerto;
  const needPurchase = analyzed.filter(p => p.cantidadReorden > 0 && !p.esProductoMuerto).sort((a, b) => {
    const sev = { sin_stock: 0, critico: 1, alerta: 2, sano: 3, sobrestock: 4, muerto: 5 };
    return (sev[a.estado] || 5) - (sev[b.estado] || 5);
  });

  return { analyzed, alerts, totalInventoryValue, capitalMuerto, capitalSano, needPurchase };
}

// ── Format helpers ──
const fmt = (n) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDec = (n) => n === Infinity ? "∞" : n.toFixed(1);

const estadoConfig = {
  sin_stock: { label: "Sin stock", color: "#1a1a2e", bg: "#1a1a2e22", icon: "⊘" },
  critico: { label: "Urgente", color: "#c0392b", bg: "#c0392b18", icon: "▲" },
  alerta: { label: "Atención", color: "#d4870e", bg: "#d4870e15", icon: "◆" },
  sano: { label: "Sano", color: "#1a8a5c", bg: "#1a8a5c12", icon: "●" },
  sobrestock: { label: "Sobrestock", color: "#2471a3", bg: "#2471a318", icon: "■" },
  muerto: { label: "Sin movimiento", color: "#7f8c8d", bg: "#7f8c8d15", icon: "○" },
};

const abcColors = { A: "#c0392b", B: "#d4870e", C: "#2471a3" };

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function SupplyBrain() {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [sales, setSales] = useState(DEMO_SALES);
  const [view, setView] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [showUpload, setShowUpload] = useState(false);

  const data = useMemo(() => analyzeProducts(products, sales), [products, sales]);

  const handleCSVUpload = useCallback((e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (type === "products") {
          const parsed = results.data.map(r => ({
            sku: r.sku || r.SKU || r.codigo || "",
            nombre: r.nombre || r.name || r.producto || "",
            categoria: r.categoria || r.category || "",
            costo: parseFloat(r.costo || r.cost || 0),
            precio: parseFloat(r.precio || r.price || r.precio_venta || 0),
            stock: parseInt(r.stock || r.stock_actual || 0),
            leadTime: parseInt(r.lead_time || r.leadTime || 7),
            proveedor: r.proveedor || r.supplier || "",
            moq: parseInt(r.moq || r.minimo || 1),
          })).filter(p => p.sku && p.nombre);
          if (parsed.length > 0) setProducts(parsed);
        } else {
          const parsed = results.data.map(r => ({
            sku: r.sku || r.SKU || r.codigo || "",
            fecha: r.fecha || r.date || "",
            cantidad: parseInt(r.cantidad || r.qty || r.quantity || 0),
            canal: r.canal || r.channel || "",
          })).filter(s => s.sku && s.fecha);
          if (parsed.length > 0) setSales(parsed);
        }
        setShowUpload(false);
      }
    });
  }, []);

  const exportCSV = useCallback(() => {
    const rows = data.needPurchase.map(p => ({
      SKU: p.sku, Producto: p.nombre, Stock_Actual: p.stock,
      Dias_Stock: Math.round(p.diasStock), Cantidad_Comprar: p.cantidadReorden,
      Costo_Estimado: p.costoCompra, Fecha_Limite: p.fechaCompra || "N/A",
      Proveedor: p.proveedor, Estado: estadoConfig[p.estado]?.label
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "recomendaciones_compra_supplybrain.csv"; a.click();
  }, [data]);

  // ── Filtered inventory ──
  const filteredProducts = useMemo(() => {
    return data.analyzed.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterEstado === "todos" || p.estado === filterEstado;
      return matchSearch && matchFilter;
    });
  }, [data, searchTerm, filterEstado]);

  // ── ABC chart data ──
  const abcCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 };
    data.analyzed.forEach(p => { counts[p.abcRotacion]++; });
    return counts;
  }, [data]);

  const abcValueCounts = useMemo(() => {
    const vals = { A: 0, B: 0, C: 0 };
    data.analyzed.forEach(p => { vals[p.abcValor] += p.capitalAtrapado; });
    return vals;
  }, [data]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#f7f8fa", minHeight: "100vh", color: "#1a1a2e" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e8e9ed", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #1a8a5c, #2471a3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>Supply Brain</span>
          <span style={{ fontSize: 10, background: "#1a8a5c20", color: "#1a8a5c", padding: "2px 6px", borderRadius: 4, fontWeight: 600, marginLeft: 4 }}>MVP</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: "◫" },
            { id: "recomendaciones", label: "Compras", icon: "↗" },
            { id: "inventario", label: "Inventario", icon: "☰" },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id); setSelectedProduct(null); }}
              style={{ padding: "6px 14px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: view === tab.id ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                background: view === tab.id ? "#1a1a2e" : "transparent", color: view === tab.id ? "#fff" : "#666", transition: "all 0.2s" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
          <button onClick={() => setShowUpload(!showUpload)} style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer", background: showUpload ? "#1a8a5c" : "#fff", color: showUpload ? "#fff" : "#333", fontFamily: "inherit", marginLeft: 8 }}>
            ↑ Subir datos
          </button>
        </div>
      </header>

      {/* ── UPLOAD PANEL ── */}
      {showUpload && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e8e9ed", padding: "20px 24px", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Catálogo de productos (CSV)</p>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Columnas: sku, nombre, categoria, costo, precio, stock, lead_time, proveedor, moq</p>
            <input type="file" accept=".csv" onChange={e => handleCSVUpload(e, "products")} style={{ fontSize: 12 }} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Historial de ventas (CSV)</p>
            <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Columnas: sku, fecha, cantidad, canal</p>
            <input type="file" accept=".csv" onChange={e => handleCSVUpload(e, "sales")} style={{ fontSize: 12 }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={() => { setProducts(DEMO_PRODUCTS); setSales(DEMO_SALES); setShowUpload(false); }}
              style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "#f7f8fa", fontFamily: "inherit" }}>
              Restaurar datos demo
            </button>
          </div>
        </div>
      )}

      <main style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* ═══ DASHBOARD VIEW ═══ */}
        {view === "dashboard" && !selectedProduct && (
          <>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <KPICard label="Valor del inventario" value={fmt(data.totalInventoryValue)} sub={`${data.analyzed.length} productos`} color="#1a1a2e" />
              <KPICard label="Capital atrapado" value={fmt(data.capitalMuerto)} sub={`${data.totalInventoryValue > 0 ? Math.round(data.capitalMuerto / data.totalInventoryValue * 100) : 0}% del total`} color="#c0392b" accent />
              <KPICard label="Capital sano" value={fmt(data.capitalSano)} sub={`${data.totalInventoryValue > 0 ? Math.round(data.capitalSano / data.totalInventoryValue * 100) : 0}% del total`} color="#1a8a5c" />
              <KPICard label="Alertas activas" value={data.alerts.length} sub={`${data.alerts.filter(a => a.severidad === "critico").length} urgentes`} color="#d4870e" accent={data.alerts.filter(a => a.severidad === "critico").length > 0} />
            </div>

            {/* Alerts */}
            {data.alerts.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", display: "inline-block" }} /> Alertas
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.alerts.slice(0, 6).map((a, i) => (
                    <div key={i} style={{ background: "#fff", border: `1px solid ${a.severidad === "critico" ? "#c0392b40" : a.severidad === "alerta" ? "#d4870e30" : "#e8e9ed"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                      onClick={() => { const p = data.analyzed.find(x => x.sku === a.sku); if (p) { setSelectedProduct(p); setView("dashboard"); } }}>
                      <span style={{ fontSize: 9, color: a.severidad === "critico" ? "#c0392b" : a.severidad === "alerta" ? "#d4870e" : a.severidad === "bajo" ? "#2471a3" : "#999", fontWeight: 700, textTransform: "uppercase", minWidth: 60 }}>
                        {a.severidad === "critico" ? "▲ Urgente" : a.severidad === "alerta" ? "◆ Alerta" : a.severidad === "bajo" ? "■ Info" : "○ Info"}
                      </span>
                      <span style={{ color: "#444" }}>{a.mensaje}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Two columns: Purchase recommendations + ABC */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Purchase Recs */}
              <section style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e9ed", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Necesitas comprar</h3>
                  <button onClick={() => setView("recomendaciones")} style={{ fontSize: 11, border: "none", background: "none", color: "#2471a3", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Ver todo →</button>
                </div>
                {data.needPurchase.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none", cursor: "pointer" }}
                    onClick={() => { setSelectedProduct(p); }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p.nombre}</span>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {p.diasStock === Infinity ? "Sin ventas" : `${Math.round(p.diasStock)} días de stock`} · Comprar {p.cantidadReorden} uds
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, ...getEstadoStyle(p.estado) }}>{estadoConfig[p.estado]?.label}</span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", marginTop: 4 }}>{fmt(p.costoCompra)}</div>
                    </div>
                  </div>
                ))}
              </section>

              {/* ABC Analysis */}
              <section style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e9ed", padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Clasificación ABC</h3>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Por rotación de ventas</p>
                  <ABCBar counts={abcCounts} total={data.analyzed.length} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Por valor de capital</p>
                  <ABCBarValue values={abcValueCounts} total={data.totalInventoryValue} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                  <ABCLegend letter="A" label="Alta prioridad" desc="80% del valor/ventas" />
                  <ABCLegend letter="B" label="Media" desc="15% del valor/ventas" />
                  <ABCLegend letter="C" label="Baja" desc="5% del valor/ventas" />
                </div>
              </section>
            </div>

            {/* Dead products */}
            {data.analyzed.filter(p => p.esProductoMuerto && p.stock > 0).length > 0 && (
              <section style={{ marginTop: 20, background: "#fff", borderRadius: 10, border: "1px solid #e8e9ed", padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#7f8c8d" }}>○ Productos sin movimiento</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {data.analyzed.filter(p => p.esProductoMuerto && p.stock > 0).map((p, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 8, background: "#f9f9fb", border: "1px solid #eee", cursor: "pointer" }} onClick={() => setSelectedProduct(p)}>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p.nombre}</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#c0392b", margin: "4px 0" }}>{fmt(p.capitalAtrapado)}</p>
                      <p style={{ fontSize: 11, color: "#999" }}>{p.stock} unidades · {p.daysSinceLastSale === Infinity ? "+60" : p.daysSinceLastSale} días sin venta</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══ PRODUCT DETAIL ═══ */}
        {selectedProduct && (
          <section style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e9ed", padding: 24 }}>
            <button onClick={() => setSelectedProduct(null)} style={{ fontSize: 12, border: "none", background: "none", color: "#2471a3", cursor: "pointer", marginBottom: 16, fontFamily: "inherit", fontWeight: 600 }}>← Volver</button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedProduct.nombre}</h2>
                <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{selectedProduct.sku} · {selectedProduct.categoria} · {selectedProduct.proveedor}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6, ...getEstadoStyle(selectedProduct.estado) }}>
                {estadoConfig[selectedProduct.estado]?.icon} {estadoConfig[selectedProduct.estado]?.label}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Stock actual" value={`${selectedProduct.stock} uds`} />
              <MetricCard label="Costo unitario" value={fmt(selectedProduct.costo)} />
              <MetricCard label="Precio de venta" value={fmt(selectedProduct.precio)} />
              <MetricCard label="Capital atrapado" value={fmt(selectedProduct.capitalAtrapado)} highlight={selectedProduct.esProductoMuerto} />
              <MetricCard label="Rotación diaria" value={`${fmtDec(selectedProduct.rotacionDiaria)} uds/día`} />
              <MetricCard label="Días de stock" value={selectedProduct.diasStock === Infinity ? "∞" : `${Math.round(selectedProduct.diasStock)} días`} />
              <MetricCard label="Punto de reorden" value={`${selectedProduct.puntoReorden} uds`} />
              <MetricCard label="Stock de seguridad" value={`${selectedProduct.stockSeguridad} uds`} />
            </div>
            {selectedProduct.cantidadReorden > 0 && !selectedProduct.esProductoMuerto && (
              <div style={{ background: "#1a8a5c0a", border: "1px solid #1a8a5c30", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a8a5c", marginBottom: 6 }}>↗ Recomendación de compra</p>
                <p style={{ fontSize: 15, color: "#333" }}>
                  Compra <strong>{selectedProduct.cantidadReorden} unidades</strong> a <strong>{selectedProduct.proveedor}</strong>.
                  Costo estimado: <strong>{fmt(selectedProduct.costoCompra)}</strong>.
                  {selectedProduct.fechaCompra === "URGENTE" ? <span style={{ color: "#c0392b", fontWeight: 700 }}> ¡URGENTE — ya deberías haber comprado!</span> : selectedProduct.fechaCompra ? ` Fecha límite: ${selectedProduct.fechaCompra}.` : ""}
                </p>
              </div>
            )}
            {/* Sales mini chart */}
            {selectedProduct.mySales?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8 }}>Historial de ventas</p>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
                  {selectedProduct.mySales.map((s, i) => {
                    const maxQ = Math.max(...selectedProduct.mySales.map(x => x.cantidad));
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 9, color: "#888" }}>{s.cantidad}</span>
                        <div style={{ width: "100%", maxWidth: 32, height: `${(s.cantidad / maxQ) * 60}px`, background: "linear-gradient(180deg, #2471a3, #2471a340)", borderRadius: "4px 4px 0 0" }} />
                        <span style={{ fontSize: 8, color: "#bbb", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{s.fecha.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#999" }}>ABC Rotación: <strong style={{ color: abcColors[selectedProduct.abcRotacion] }}>{selectedProduct.abcRotacion}</strong></div>
              <div style={{ fontSize: 11, color: "#999" }}>ABC Valor: <strong style={{ color: abcColors[selectedProduct.abcValor] }}>{selectedProduct.abcValor}</strong></div>
              <div style={{ fontSize: 11, color: "#999" }}>Lead time: <strong>{selectedProduct.leadTime} días</strong></div>
              <div style={{ fontSize: 11, color: "#999" }}>MOQ: <strong>{selectedProduct.moq} uds</strong></div>
            </div>
          </section>
        )}

        {/* ═══ RECOMMENDATIONS VIEW ═══ */}
        {view === "recomendaciones" && !selectedProduct && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recomendaciones de compra</h2>
                <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{data.needPurchase.length} productos necesitan reorden · Inversión total: {fmt(data.needPurchase.reduce((s, p) => s + p.costoCompra, 0))}</p>
              </div>
              <button onClick={exportCSV} style={{ padding: "8px 16px", border: "1px solid #1a8a5c", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#1a8a5c", color: "#fff", fontWeight: 600, fontFamily: "inherit" }}>
                ↓ Exportar CSV
              </button>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e9ed", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f7f8fa", borderBottom: "1px solid #e8e9ed" }}>
                    {["Estado", "Producto", "Stock", "Días stock", "Comprar", "Costo", "Fecha límite", "Proveedor"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.needPurchase.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => setSelectedProduct(p)}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9f9fb"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "10px 12px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, ...getEstadoStyle(p.estado) }}>{estadoConfig[p.estado]?.label}</span></td>
                      <td style={{ padding: "10px 12px", fontWeight: 500 }}>{p.nombre}<br /><span style={{ fontSize: 10, color: "#999" }}>{p.sku}</span></td>
                      <td style={{ padding: "10px 12px" }}>{p.stock}</td>
                      <td style={{ padding: "10px 12px" }}>{p.diasStock === Infinity ? "∞" : Math.round(p.diasStock)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.cantidadReorden} uds</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{fmt(p.costoCompra)}</td>
                      <td style={{ padding: "10px 12px", color: p.fechaCompra === "URGENTE" ? "#c0392b" : "#333", fontWeight: p.fechaCompra === "URGENTE" ? 700 : 400 }}>{p.fechaCompra || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "#888" }}>{p.proveedor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══ INVENTORY VIEW ═══ */}
        {view === "inventario" && !selectedProduct && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Inventario completo</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <input type="text" placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: "8px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, flex: 1, minWidth: 200, fontFamily: "inherit", outline: "none" }} />
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                style={{ padding: "8px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}>
                <option value="todos">Todos los estados</option>
                {Object.entries(estadoConfig).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e9ed", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
                <thead>
                  <tr style={{ background: "#f7f8fa", borderBottom: "1px solid #e8e9ed" }}>
                    {["SKU", "Producto", "Cat.", "Stock", "Costo", "Capital", "ABC Rot.", "ABC Val.", "Rot./día", "Días stock", "Estado"].map(h => (
                      <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => setSelectedProduct(p)}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9f9fb"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "8px 10px", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{p.sku}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 500 }}>{p.nombre}</td>
                      <td style={{ padding: "8px 10px", fontSize: 11, color: "#888" }}>{p.categoria}</td>
                      <td style={{ padding: "8px 10px" }}>{p.stock}</td>
                      <td style={{ padding: "8px 10px" }}>{fmt(p.costo)}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{fmt(p.capitalAtrapado)}</td>
                      <td style={{ padding: "8px 10px" }}><ABCBadge letter={p.abcRotacion} /></td>
                      <td style={{ padding: "8px 10px" }}><ABCBadge letter={p.abcValor} /></td>
                      <td style={{ padding: "8px 10px" }}>{fmtDec(p.rotacionDiaria)}</td>
                      <td style={{ padding: "8px 10px" }}>{p.diasStock === Infinity ? "∞" : Math.round(p.diasStock)}</td>
                      <td style={{ padding: "8px 10px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", ...getEstadoStyle(p.estado) }}>{estadoConfig[p.estado]?.icon} {estadoConfig[p.estado]?.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: "#999", marginTop: 8 }}>{filteredProducts.length} de {data.analyzed.length} productos</p>
          </section>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──
function KPICard({ label, value, sub, color, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${accent ? color + "30" : "#e8e9ed"}`, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color, margin: "4px 0", fontFamily: "'Space Mono', monospace" }}>{value}</p>
      <p style={{ fontSize: 11, color: "#aaa" }}>{sub}</p>
    </div>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: highlight ? "#c0392b08" : "#f7f8fa", border: `1px solid ${highlight ? "#c0392b20" : "#eee"}` }}>
      <p style={{ fontSize: 10, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: highlight ? "#c0392b" : "#1a1a2e", marginTop: 4 }}>{value}</p>
    </div>
  );
}

function ABCBadge({ letter }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff", background: abcColors[letter] }}>
      {letter}
    </span>
  );
}

function ABCBar({ counts, total }) {
  if (total === 0) return null;
  return (
    <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 28 }}>
      {["A", "B", "C"].map(l => {
        const pct = (counts[l] / total) * 100;
        if (pct === 0) return null;
        return (
          <div key={l} style={{ width: `${pct}%`, background: abcColors[l], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, minWidth: pct > 5 ? 30 : 0 }}>
            {pct > 10 ? `${l} (${counts[l]})` : l}
          </div>
        );
      })}
    </div>
  );
}

function ABCBarValue({ values, total }) {
  if (total === 0) return null;
  return (
    <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 28 }}>
      {["A", "B", "C"].map(l => {
        const pct = (values[l] / total) * 100;
        if (pct === 0) return null;
        return (
          <div key={l} style={{ width: `${pct}%`, background: abcColors[l] + "cc", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, minWidth: pct > 5 ? 30 : 0 }}>
            {pct > 10 ? `${l} (${Math.round(pct)}%)` : l}
          </div>
        );
      })}
    </div>
  );
}

function ABCLegend({ letter, label, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: abcColors[letter], marginTop: 1, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 11, fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 10, color: "#999" }}>{desc}</p>
      </div>
    </div>
  );
}

function getEstadoStyle(estado) {
  const c = estadoConfig[estado];
  if (!c) return {};
  return { background: c.bg, color: c.color };
}
