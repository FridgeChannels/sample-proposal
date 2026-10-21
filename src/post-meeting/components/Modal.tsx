import { Modal as SharedModal, type ModalProps } from '../../components/ui/Modal'

export function Modal(props: ModalProps) {
  return <SharedModal {...props} variant="legacy" />
}
