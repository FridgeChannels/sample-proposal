import { Modal } from './Modal'

export type LegalDocPreview = {
  label: string
  previewSrc: string
}

export function LegalDocModal({ doc, onClose }: { doc: LegalDocPreview; onClose: () => void }) {
  return (
    <Modal title={doc.label} ariaLabel={doc.label} onClose={onClose}>
      <iframe
        className="legal-doc-frame"
        title={doc.label}
        src={doc.previewSrc}
      />
    </Modal>
  )
}
