# PropTech - Plataforma Comercial y Visor de Planos Interactivos

Aplicación web corporativa escalable y orientada a eventos para la gestión, visualización e interacción de activos comerciales usando mapas satelitales y visor de planos interactivos.

## 🏗️ Arquitectura del Proyecto

- **Frontend (`/frontend`)**: Desarrollado en **Next.js 14**, React, TailwindCSS, Konva / SVG y visores de planos interactivos con coordenadas normalizadas.
- **Backend (`/backend`)**: API REST desarrollada en **Python FastAPI**, PostgreSQL / PostGIS / SQLite, sistema de tickets, gestión de locales y arquitectura de eventos con Outbox pattern.

## 🚀 Despliegue en Vercel (Frontend)

Para desplegar el Frontend en Vercel:
1. **Root Directory**: Configurar en los ajustes del proyecto (`Settings` -> `General`) el valor `frontend`.
2. **Framework Preset**: Next.js (se detecta automáticamente al definir el Root Directory).
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`
5. **Variable de entorno**: `NEXT_PUBLIC_API_URL` con la URL pública del backend (ej. `https://proptech-api.onrender.com/api/v1`).

> El frontend usa `output: 'export'` (sitio estático). Las rutas `/api/*` de Next.js no existen en producción: la subida de planos PDF se hace contra el backend (`POST /api/v1/planos/upload`).

## ☁️ Despliegue en Render

`render.yaml` define dos servicios:
- **proptech-api** (FastAPI): genera `SECRET_KEY` y `WEBHOOK_HMAC_SECRET` automáticamente y ejecuta `seed.py` en el build.
- **proptech-web** (sitio estático): publica `./out`. Ajusta `NEXT_PUBLIC_API_URL` si el nombre del servicio del API cambia.

## 🔐 CORS

El backend acepta los orígenes de `BACKEND_CORS_ORIGINS` (localhost por defecto; se puede sobreescribir con una lista JSON en la variable de entorno) y cualquier subdominio de `vercel.app` / `onrender.com` vía `BACKEND_CORS_ORIGIN_REGEX`.

## 🧪 Tests

```bash
cd backend && python -m pytest -q   # tests del API
python tests_e2e/run_e2e.py         # suite E2E (desde la raíz)
```
