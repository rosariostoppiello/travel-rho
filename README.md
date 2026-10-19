# Bitácora

Web app para organizar un viaje desde el celular: cronograma con lo que viene ahora, mapas por día, valija con plantillas reutilizables, gastos compartidos y notas. Se comparte con un link.

## Correrla en la compu

```bash
npm install
npm run dev
```

Sin variables de entorno guarda todo en `.data/db.json` (sólo para probar).

Para probarla desde el celu (misma wifi que la compu):

```bash
npm run celu
```

y en el celu abrí `http://<IP de la compu>:3001` (la IP aparece como "Network" al arrancar).

## Subirla a Vercel

1. Subí este repo a GitHub (privado está bien).
2. En vercel.com → **Add New → Project** → importá el repo. Deploy.
3. En el proyecto: **Storage → Create Database → Upstash (Redis)** → conectalo al proyecto. Esto agrega `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
4. (Opcional) **Settings → Environment Variables** → `APP_PASSWORD` con una contraseña. Se pide sólo para crear viajes nuevos.
5. **Deployments → Redeploy** para que tome las variables.

## En el iPhone

Abrí el link en Safari → compartir → **Agregar a pantalla de inicio**. Se abre como una app, a pantalla completa.

## Compartir

En **Más → Viaje** está el link para mandar por WhatsApp. Quien lo abre elige su nombre y ve/edita todo. Los cambios aparecen en los otros teléfonos en unos segundos.

## Cargar lugares

En cada actividad, en "Dónde", pegá el link de Google Maps (en la app: Compartir → Copiar link) o buscá por nombre. Eso pone el pin en el mapa y arma los botones de "Cómo llegar".
