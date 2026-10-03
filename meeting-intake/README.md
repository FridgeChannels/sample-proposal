# Meeting intake module

This folder is a self-contained DTC and Amazon meeting-booking flow. Copy the entire `meeting-intake` directory into another React + Node project, then mount one of the two client components and register the server handler.

## Included

- `client/DtcMeetingForm.tsx` — DTC intake form and validation.
- `client/AmazonMeetingForm.tsx` — Amazon / ASIN intake form and validation.
- `client/submitApplication.ts` — form token, API submission, and Calendly prefill helpers.
- `server/notion.js` — server-side validation and Notion page creation.
- `server/security.js` — origin checks, form tokens, rate limits, and in-memory deduplication.
- `server/routes.js` — reusable `GET` form-token and `POST` application handler.
- `styles/` — the current DTC and Amazon form skins.

## Client usage

```tsx
import { DtcMeetingForm } from './meeting-intake'
import './meeting-intake/styles/dtc.css'

export function ProposalPage() {
  return <DtcMeetingForm calendlyUrl="https://calendly.com/your-team/intro" />
}
```

Use `AmazonMeetingForm` and `styles/amazon.css` for the Amazon / ASIN version. Both components accept:

```ts
{
  calendlyUrl?: string
  magnetSn?: string
  api?: {
    formToken?: string // defaults to /api/about-pilot/form-token
    submit?: string    // defaults to /api/about-pilot/apply
  }
}
```

## Server usage

```js
const { handleMeetingIntakeRequest } = require('./meeting-intake/server/routes')

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  if (await handleMeetingIntakeRequest(req, res, requestUrl)) return
  // Other routes continue here.
}
```

The default endpoints are `GET /api/about-pilot/form-token` and `POST /api/about-pilot/apply`. To change them, pass matching `routes` options to `handleMeetingIntakeRequest` and the same `api` values to the component.

## Environment

```text
NOTION_API_TOKEN=ntn_...
NOTION_ABOUT_PILOT_DATABASE_ID=your-notion-database-id
MEETING_INTAKE_FORM_SECRET=a-long-random-secret
MEETING_INTAKE_ALLOWED_ORIGINS=https://your-site.example
```

`NOTION_API_TOKEN` and `MEETING_INTAKE_FORM_SECRET` are server-only values. Do not expose either to the browser.

## Notion database contract

The target database needs the properties referenced in `server/notion.js`, including `Application Title`, `Channel`, `Status`, `Full Name`, `Title`, `Email`, `Website`, `Source Page`, `Submitted At`, and `Raw Payload`. DTC and Amazon have additional properties that are listed in `buildNotionProperties`.

The handler returns success only after Notion creates a page. The client opens Calendly only after receiving that success response. Failed writes stay on the form and show an error.

## Before reusing in a new project

1. Share the destination Notion database with the integration and create matching properties.
2. Set the four environment variables above on the new server.
3. Add the new site domain to `MEETING_INTAKE_ALLOWED_ORIGINS`.
4. Set the new Calendly URL through the component prop.
5. Change `sourcePage` values and Notion property mapping in `server/notion.js` only if the new project needs a different CRM schema.
