import { useState, useEffect } from 'react';
import ActorInfoForm, { ActorData, createDefaultActor } from '@/features/EpisodeForm/ActorInfoForm';
import { Modal, Toast } from '@/primitives';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actorData: ActorData) => void;
  initialData?: ActorData;
  isLoading?: boolean;
  error?: string;
}

export function UpdateProfileModal({ isOpen, onClose, onConfirm, initialData, isLoading, error: stepError }: UpdateProfileModalProps) {
  const [actorData, setActorData] = useState<ActorData>(() => initialData ?? createDefaultActor());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [wasLoading, setWasLoading] = useState(false);

  const isBusy = isLoading ?? false;
  const isValid = actorData.name.trim().length > 0 && actorData.imageBlob !== null;

  const handleClose = () => {
    if (isBusy) return;
    setActorData(initialData ?? createDefaultActor());
    setToastMessage(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid || isBusy) return;
    setWasLoading(true);
    onConfirm(actorData);
  };

  useEffect(() => {
    // Detect when loading finishes
    if (wasLoading && !isBusy) {
      if (stepError) {
        // Show error toast
        setToastType('error');
        setToastMessage(stepError);
      } else {
        // Show success toast and close modal
        setToastType('success');
        setToastMessage('Profile updated!');
        setTimeout(() => {
          onClose();
        }, 100);
      }
      setWasLoading(false);
    }
  }, [isBusy, wasLoading, stepError, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile" disabled={isBusy}>
      <div className="update-profile-form-wrap">
        <ActorInfoForm
          initialData={initialData}
          onChange={setActorData}
          onError={() => {}}
          disabled={isBusy}
        />
      </div>

      <div style={{ display: "flex" }}>
        <button
          className="secondary"
          onClick={handleConfirm}
          disabled={!isValid || isBusy}
          style={{ marginLeft: "auto" }}
        >
          {isBusy ? 'signing...' : 'Confirm'}
        </button>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={toastType === 'success' ? 3000 : 4000}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Modal>
  );
}
