import { liveDemoUrlForSn, LIVE_DEMO_URL, snFromLocation } from '../config'

/**
 * Live demo iframe: same /p/{sn} shape as the customer sample URL,
 * with SN taken from the current path (or ?sn=) instead of a hardcoded value.
 */
export function LiveDemoView() {
  const sn = snFromLocation()
  const src = sn ? liveDemoUrlForSn(sn) : LIVE_DEMO_URL

  return (
    <main className="live-demo-view">
      <iframe
        src={src}
        title="FridgeChannel live demo"
        loading="eager"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
      />
    </main>
  )
}
