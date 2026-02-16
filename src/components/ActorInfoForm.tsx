import { ChangeEvent, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { blobToBase64, type CroppedImageData } from '../utils'
import './ActorInfoForm.css';

export interface ActorData {
  name: string;
  imageBlob: Blob | null;
  imageBuffer: string | null;
}

export const DEFAULT_ACTOR_IMAGE = '/Images/mystery-actor.png';

export const createDefaultActor = (): ActorData => ({
  name: '',
  imageBlob: null,
  imageBuffer: null,
});

interface ActorInfoFormProps {
  index: number;
  initialData?: ActorData;
  onChange: (data: ActorData) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  inputIdPrefix?: string;
}

export default function ActorInfoForm({
  index,
  initialData,
  onChange,
  onError,
  disabled = false,
  inputIdPrefix = 'actor',
}: ActorInfoFormProps) {
  const init = initialData ?? createDefaultActor();
  const [name, setName] = useState(init.name);
  const [imageBlob, setImageBlob] = useState<Blob | null>(init.imageBlob);
  const [imageBuffer, setImageBuffer] = useState<string | null>(init.imageBuffer);

  const inputId = `${inputIdPrefix}-${index}-name`;
  const imageInputId = `${inputIdPrefix}-${index}-image`;

  const handleNameChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z0-9_ ]/g, '');
    if (filtered.length > 12) {
      onError('Name must be 12 characters or less');
      return;
    }
    setName(filtered);
    onChange({ name: filtered, imageBlob, imageBuffer });
  };

  const handleImageChange = (data: CroppedImageData) => {
    setImageBlob(data.blob);
    blobToBase64(data.blob).then(buffer => {
      setImageBuffer(buffer);
      onChange({ name, imageBlob: data.blob, imageBuffer: buffer });
    });
  };

  return (
    <section className="section actor-info-form">
      <div className="actor-info-body">
        <ImageUpload
          defaultPreview={DEFAULT_ACTOR_IMAGE}
          initialBlob={init.imageBlob ?? undefined}
          onImageChange={handleImageChange}
          onError={onError}
          inputId={imageInputId}
        />
        <div className="actor-info-fields">
          <label htmlFor={inputId}>Enter Name:</label>
          <input
            id={inputId}
            type="text"
            required
            maxLength={12}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
            placeholder="*Up to 12 Characters"
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  );
}
