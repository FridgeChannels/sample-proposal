import { liveDemoUrlForSn, LIVE_DEMO_URL, snFromLocation } from '../config'

/**
 * Live demo iframe: same /p/{sn} shape as the customer sample URL,
 * with SN taken from the current path (or ?sn=) instead of a hardcoded value.
 */
export function LiveDemoView({ active, onSeePlan }: { active: boolean; onSeePlan: () => void }) {
  const sn = snFromLocation()
  const src = sn ? liveDemoUrlForSn(sn) : LIVE_DEMO_URL

  return (
    <main className={`live-demo-view has-flow-cta${active ? '' : ' is-preserved-hidden'}`} aria-hidden={!active}>
      <iframe
        src={src}
        title="FridgeChannel live demo"
        loading="eager"
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
      />
      <div className="flow-cta-bar">
        <button type="button" className="flow-cta-button" onClick={onSeePlan}>
          <span>See Pilot Plan</span>
          <b>→</b>
        </button>
      </div>
    </main>
  )
}
