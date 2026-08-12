import type { PostHogConfig } from 'posthog-js'

export const POSTHOG_TOKEN = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string | undefined

export const posthogOptions: Partial<PostHogConfig> = {
  api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com',
  defaults: '2026-05-30',
  // Keep first paint light unless explicitly enabled.
  disable_session_recording: import.meta.env.VITE_POSTHOG_SESSION_REPLAY !== 'true',
  persistence: 'localStorage+cookie',
}
