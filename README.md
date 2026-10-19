# RAVE — Sistema de gestión odontológica

Sistema web de gestión para **RAVE Odontología Integral y Estética**, consultorio
odontológico independiente en Cali. Es también el proyecto de grado de Yeisy
Paola Angulo. Lo usa únicamente el personal del consultorio (administración,
atención clínica, agenda, facturación, historias clínicas); no hay portal de
autoservicio para pacientes.

## Stack

- **Frontend:** React 18 + Vite, React Router v7, Redux Toolkit
- **Datos/Auth:** Supabase (Postgres + Auth + RLS), Google OAuth con lista blanca
  de correos (`authorized_emails`)
- **Agenda:** `react-big-calendar` + `moment` · **Odontograma:** `react-odontogram-editor-modul`
- **PDFs:** `jspdf` (facturas y consentimientos) · **Gráficos:** `recharts`
- **WhatsApp:** Supabase Edge Functions sobre la Cloud API de Meta (`supabase/functions/`)
- **Lint:** ESLint · **Tests:** Vitest

## Arquitectura

Patrón por capas: `pages/` (vistas, sufijo `VW`) → `controllers/` (lógica de
negocio) → `dao/` (acceso a Supabase) → Supabase. Ver [`Context`](./Context)
para el detalle completo del proyecto, roles y trabajo pendiente.

## Puesta en marcha

Requisitos: Node 20+ y un proyecto Supabase.

```bash
npm install
cp .env.example .env   # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

El esquema de la base de datos está en [`db/supabase_schema.sql`](./db/supabase_schema.sql).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run test:watch` | Pruebas en modo watch |

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |

No subas `.env` ni secretos. Los secrets de WhatsApp/Meta se configuran en
Supabase (Edge Functions → Secrets); ver [`supabase/functions/README.md`](./supabase/functions/README.md).

## Repositorio

https://github.com/yeisyp1/rave
