import { LIVE_DEMO_URL } from '../config'

export function LiveDemoView() {
  return (
    <main className="live-demo-view">
      <iframe src={LIVE_DEMO_URL} title="FridgeChannel live demo" loading="eager" allow="clipboard-read; clipboard-write; fullscreen" allowFullScreen />
    </main>
  )
}
