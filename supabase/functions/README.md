# Edge Functions — mensajería WhatsApp (CU-17, CU-21, CU-22, CU-23)

Proyecto Supabase: `czfuquhkjuhbwnkbgkze` (Rave). Proveedor: **WhatsApp Business Cloud API de Meta**.

## Funciones

| Función | JWT | Qué hace |
|---|---|---|
| `queue-appointment-reminders` | Sí (cron cada hora) | Busca citas confirmadas entre 23-25 h en el futuro sin recordatorio enviado y encola un mensaje en `whatsapp_messages`. Omite pacientes con `whatsapp_baja`. |
| `process-whatsapp-queue` | Sí (cron cada 5 min) | Entrega los mensajes `pending` por la Cloud API. Omite (`skipped`) a quien dio de baja WhatsApp. Si faltan los secrets de Meta los marca `no_provider`. |
| `whatsapp-webhook` | **No** (`--no-verify-jwt`) | Recibe los mensajes del paciente: crea solicitudes de cita (`cita`/`agendar`/`turno`) o de cancelación (`cancelar`), y gestiona `BAJA`/`ALTA`. Verifica la firma `X-Hub-Signature-256` de Meta. |

## Secrets (Dashboard → Edge Functions → Secrets)

| Secret | Para qué |
|---|---|
| `META_VERIFY_TOKEN` | Texto que tú inventas; lo pegas también en Meta al registrar el webhook. |
| `META_APP_SECRET` | App Dashboard → Settings → Basic → App secret. Firma cada petición de Meta. |
| `META_WA_TOKEN` | Token de acceso permanente (usuario del sistema) o temporal para pruebas. |
| `META_WA_PHONE_NUMBER_ID` | WhatsApp → API Setup → Phone number ID. |
| `META_WA_TEMPLATE_NAME` | Nombre de la plantilla aprobada para recordatorios (cuerpo con `{{1}}` fecha y `{{2}}` hora). |
| `META_WA_TEMPLATE_LANG` | Opcional, por defecto `es`. |

Ninguno tiene valor de respaldo en el código: sin ellos la función rechaza las peticiones.

## Desplegar

```bash
npx supabase login
npx supabase functions deploy whatsapp-webhook --no-verify-jwt --project-ref czfuquhkjuhbwnkbgkze
npx supabase functions deploy process-whatsapp-queue queue-appointment-reminders --project-ref czfuquhkjuhbwnkbgkze
```

## Configurar Meta

1. Crea una app en [developers.facebook.com](https://developers.facebook.com) (tipo **Business**) y agrega el producto **WhatsApp**.
2. En **WhatsApp → API Setup** obtienes un número de prueba gratis, el *Phone number ID* y un token temporal. Agrega tu celular como destinatario de prueba.
3. En **WhatsApp → Configuration → Webhook** pega:
   - URL: `https://czfuquhkjuhbwnkbgkze.supabase.co/functions/v1/whatsapp-webhook`
   - Verify token: el valor de `META_VERIFY_TOKEN`
   - Suscríbete al campo `messages`.
4. Para producción: verifica el negocio en Meta Business, agrega el número de la clínica (no puede estar activo en la app de WhatsApp normal), crea un token permanente de usuario del sistema y registra la plantilla de recordatorio (categoría *Utility*, idioma español) en **WhatsApp Manager → Message templates**.

## Reglas de WhatsApp a tener en cuenta

- El primer mensaje a un paciente (recordatorio) solo puede ser una **plantilla aprobada**. Mensajes de texto libre solo se aceptan dentro de las 24 h posteriores a que el paciente escriba.
- Las respuestas del asistente (cita, cancelar, baja) van dentro de esa ventana, así que no necesitan plantilla.
- Los pacientes pueden escribir `BAJA` para dejar de recibir mensajes (queda en `patients.whatsapp_baja`) y `ALTA` para reactivarlos.
