import { useState } from 'react';
import ActorInfoForm, { ActorData, createDefaultActor } from '@/features/EpisodeForm/ActorInfoForm';
import { Modal } from '@/primitives';
import { useToast } from '@/context/ToastContext';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actorData: ActorData) => Promise<void>;
  initialData?: ActorData;
}

export function UpdateProfileModal({ isOpen, onClose, onConfirm, initialData }: UpdateProfileModalProps) {
  const [actorData, setActorData] = useState<ActorData>(() => initialData ?? createDefaultActor());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isValid = actorData.name.trim().length > 0 && actorData.imageBlob !== null;

  const handleClose = () => {
    if (isSubmitting) return;
    setActorData(initialData ?? createDefaultActor());
    onClose();
  };

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(actorData);
      showToast('Profile updated!', 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error && error.message ? error.message : 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile" disabled={isSubmitting}>
        <ActorInfoForm
          initialData={initialData}
          onChange={setActorData}
          disabled={isSubmitting}
        />

      <div className='flex justify-end'>
        <button
          className="secondary"
          onClick={handleConfirm}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'signing...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
