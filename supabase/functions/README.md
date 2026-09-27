# Edge Functions — mensajería WhatsApp (CU-17, CU-21, CU-22, CU-23)

Proyecto Supabase: `czfuquhkjuhbwnkbgkze` (Rave).

## Estado

| Función | Desplegada | Qué hace |
|---|---|---|
| `queue-appointment-reminders` | Sí (cron cada hora) | Busca citas confirmadas entre 23-25h en el futuro sin recordatorio enviado y encola un mensaje en `whatsapp_messages`. |
| `process-whatsapp-queue` | Sí (cron cada 5 min) | Entrega los mensajes `pending` de `whatsapp_messages` vía Twilio. Si no hay credenciales de Twilio configuradas, los marca `no_provider` sin fallar. |
| `whatsapp-webhook` | **No** — el despliegue con `verify_jwt: false` fue bloqueado por el clasificador de permisos de Claude Code | Recibe mensajes entrantes de Twilio, registra al paciente por teléfono, y crea solicitudes de cita (`cita`/`agendar`/`turno`) o de cancelación (`cancelar`) en `appointments`. |

El código de las tres funciones está en este directorio (`whatsapp-webhook/`, `process-whatsapp-queue/`, `queue-appointment-reminders/`).

## Desplegar `whatsapp-webhook` manualmente

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref czfuquhkjuhbwnkbgkze
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

O desde el Dashboard: Edge Functions → Deploy a new function → pega el contenido de `whatsapp-webhook/index.ts`, y desmarca "Verify JWT" en la configuración de la función (Twilio no puede enviar un JWT de Supabase).

## Configurar el secreto del webhook

La función viene con un secreto de respaldo embebido (`7f4d51a4af8307b93ff8b54c27f6620d9373187cd65c3cd3`) solo para que funcione de inmediato. **Genera uno nuevo antes de usarlo en producción**:

```bash
openssl rand -hex 24
supabase secrets set WEBHOOK_SHARED_SECRET=<el valor generado>
```

La URL que le das a Twilio debe incluir ese secreto como query param:
`https://czfuquhkjuhbwnkbgkze.supabase.co/functions/v1/whatsapp-webhook?secret=<el valor>`

## Crear una cuenta de WhatsApp para pruebas (Twilio)

1. Crea una cuenta gratuita en [twilio.com](https://www.twilio.com/try-twilio).
2. En el panel, ve a **Messaging → Try it out → Send a WhatsApp message** y activa el **WhatsApp Sandbox** (gratis, permite enviar/recibir mensajes de inmediato uniéndote con un código desde tu WhatsApp).
3. Copia el **Account SID** y el **Auth Token** (Console → Account Info).
4. El número del sandbox es `+1 415 523 8886` (o el que te asigne tu sandbox).
5. En **Sandbox settings**, configura el webhook "WHEN A MESSAGE COMES IN" con la URL del paso anterior (con `?secret=...`), método `HTTP POST`.

## Configurar los secrets de envío

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_WHATSAPP_FROM=+14155238886
```

En cuanto estén configurados, `process-whatsapp-queue` empezará a entregar automáticamente (cada 5 min) los recordatorios (CU-17) y confirmaciones de cita (CU-22) que la app ya está encolando en `whatsapp_messages`.

## Migrar de Twilio Sandbox a un número propio / Meta Cloud API

Cuando quieras pasar a producción con tu propio número de WhatsApp Business, solo cambias `TWILIO_WHATSAPP_FROM` (Twilio) o reescribes `sendViaTwilio` en `process-whatsapp-queue/index.ts` para usar la Meta Cloud API — el resto del sistema (cola, plantillas, espejo de citas) no cambia.
