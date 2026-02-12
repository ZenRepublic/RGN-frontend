import { useState } from 'react';
import ActorInfoForm, { ActorData, createDefaultActor } from '@/components/ActorInfoForm';
import type { UpdateProfileStep } from '@/hooks/useUpdateProfile';
import './UpdateProfileModal.css';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actorData: ActorData) => void;
  initialData?: ActorData;
  step?: UpdateProfileStep;
}

const STATUS_MESSAGES: Partial<Record<UpdateProfileStep['status'], string>> = {
  'getting-challenge': 'Requesting challenge from server...',
  'signing': 'Please sign the message with your wallet...',
  'updating': 'Updating your profile...',
};

export function UpdateProfileModal({ isOpen, onClose, onConfirm, initialData, step }: UpdateProfileModalProps) {
  const [actorData, setActorData] = useState<ActorData>(() => initialData ?? createDefaultActor());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBusy = step?.status === 'getting-challenge' || step?.status === 'signing' || step?.status === 'updating';
  const isValid = actorData.name.trim().length > 0 && actorData.imageBlob !== null;

  const handleClose = () => {
    if (isBusy) return;
    setActorData(initialData ?? createDefaultActor());
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid || isBusy) return;
    onConfirm(actorData);
  };

  const statusMessage = step ? STATUS_MESSAGES[step.status] : undefined;
  const stepError = step?.status === 'error' ? step.error : undefined;

  return (
    <div className="update-profile-overlay" onClick={handleClose}>
      <div className="update-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="update-profile-header-row">
          <h2 className="update-profile-title">Edit Profile</h2>
          <button className="update-profile-close" onClick={handleClose} disabled={isBusy}>Close</button>
        </div>

        <div className="update-profile-form-wrap">
          <ActorInfoForm
            index={0}
            initialData={initialData}
            onChange={setActorData}
            onError={setError}
            disabled={isBusy}
            inputIdPrefix="update-profile"
          />
        </div>

        {(error || stepError) && <p className="update-profile-error">{stepError || error}</p>}
        {statusMessage && <p className="update-profile-status">{statusMessage}</p>}

        <div className="update-profile-footer">
          <button
            className="update-profile-confirm"
            onClick={handleConfirm}
            disabled={!isValid || isBusy}
          >
            {isBusy ? '...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
