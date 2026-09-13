export function SampleContentView({ onBack }: { onBack: () => void }) {
  return (
    <main className="sample-content-view has-flow-cta">
      <iframe src="/gift-challenge-react.html" title="FridgeChannel sample content" loading="eager" />
      <div className="flow-cta-bar is-secondary">
        <button type="button" className="flow-cta-button" onClick={onBack}>
          <b>←</b>
          <span>Back to Pilot Plan</span>
        </button>
      </div>
    </main>
  )
}
