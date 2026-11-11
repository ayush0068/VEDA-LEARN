import { useState } from 'react';
import type { ReactNode } from 'react';
import Modal from '@/components/common/Modal';
import { Spinner, btnDanger, btnPrimary, btnSecondary } from '@/components/common/ui';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  /** may throw; the message is shown in the dialog */
  onConfirm: () => Promise<void>;
}

export default function ConfirmDialog({ open, title, children, confirmLabel, danger, onClose, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setError('');
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      setBusy(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      busy={busy}
      title={title}
      width="max-w-sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy} className={danger ? btnDanger : btnPrimary}>
            {busy && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-[0.88rem] leading-relaxed text-veda-text">{children}</div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
          {error}
        </p>
      )}
    </Modal>
  );
}