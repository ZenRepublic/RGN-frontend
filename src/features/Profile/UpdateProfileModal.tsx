import { useState, useEffect } from 'react';
import ActorInfoForm, { ActorData, createDefaultActor } from '@/features/EpisodeForm/ActorInfoForm';
import { Modal } from '@/primitives';
import { useToast } from '@/context/ToastContext';

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
  const [wasLoading, setWasLoading] = useState(false);
  const { showToast } = useToast();

  const isBusy = isLoading ?? false;
  const isValid = actorData.name.trim().length > 0 && actorData.imageBlob !== null;

  const handleClose = () => {
    if (isBusy) return;
    setActorData(initialData ?? createDefaultActor());
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
        showToast(stepError);
      } else {
        showToast('Profile updated!', 'success');
        setTimeout(() => {
          onClose();
        }, 100);
      }
      setWasLoading(false);
    }
  }, [isBusy, wasLoading, stepError, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile" disabled={isBusy}>
        <ActorInfoForm
          initialData={initialData}
          onChange={setActorData}
          disabled={isBusy}
        />

      <div className='flex justify-end'>
        <button
          className="secondary"
          onClick={handleConfirm}
          disabled={!isValid || isBusy}
        >
          {isBusy ? 'signing...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
