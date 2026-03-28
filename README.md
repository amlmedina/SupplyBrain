# Supply Brain MVP

Plataforma inteligente de inventario y compras para microempresas de retail y e-commerce en LATAM.

## ¿Qué hace?

- **Dashboard financiero**: Muestra cuánto dinero tienes atrapado en inventario
- **Clasificación ABC**: Identifica automáticamente tus productos más importantes
- **Recomendaciones de compra**: Te dice qué comprar, cuánto y cuándo
- **Alertas inteligentes**: Avisa antes de que se agote un producto o tengas sobrestock
- **Carga de datos CSV**: Sube tu catálogo y ventas desde Excel/CSV

## Inicio rápido

### Opción 1: Local (requiere Node.js)

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/supply-brain-mvp.git
cd supply-brain-mvp

# 2. Instala dependencias
npm install

# 3. Arranca el servidor de desarrollo
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### Opción 2: Desplegar en Vercel (recomendado, gratis)

1. Sube este repo a GitHub
2. Ve a [vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
3. Importa el repositorio `supply-brain-mvp`
4. Haz clic en **Deploy** (Vercel detecta Vite automáticamente)
5. En ~60 segundos tendrás tu URL pública

### Opción 3: Desplegar en Netlify (alternativa gratuita)

1. Ve a [netlify.com](https://netlify.com) y conecta GitHub
2. Importa el repositorio
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy

## Cómo usar

### Con datos demo
La app viene con 10 productos de ejemplo y datos de ventas de 3 meses. Solo ábrela y explora.

### Con tus propios datos
1. Haz clic en **↑ Subir datos**
2. Sube un CSV de **catálogo** con estas columnas:
   - `sku`, `nombre`, `categoria`, `costo`, `precio`, `stock`, `lead_time`, `proveedor`, `moq`
3. Sube un CSV de **ventas** con estas columnas:
   - `sku`, `fecha`, `cantidad`, `canal`

### Exportar recomendaciones
1. Ve a la pestaña **Compras**
2. Haz clic en **↓ Exportar CSV**
3. Envía el archivo a tu proveedor

## Estructura del proyecto

```
supply-brain-mvp/
├── index.html          # HTML principal
├── package.json        # Dependencias
├── vite.config.js      # Config de Vite
└── src/
    ├── main.jsx        # Entry point de React
    └── App.jsx         # Aplicación completa (Supply Brain)
```

## Stack

- **React 18** — UI
- **Vite** — Build tool
- **PapaParse** — Parser de CSV
- **Sin backend** — Todo corre en el navegador (MVP)

## Roadmap

- [ ] V1: Integraciones (Shopify, MercadoLibre, WooCommerce)
- [ ] V1: Notificaciones por email y WhatsApp
- [ ] V1: Forecast de ventas (media móvil)
- [ ] V2: Forecast avanzado (ML)
- [ ] V2: Simulador de escenarios
- [ ] V2: API pública

## Licencia

Privado — Todos los derechos reservados.
