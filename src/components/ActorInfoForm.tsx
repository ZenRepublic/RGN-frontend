import { ChangeEvent, useEffect, useRef, useState } from 'react';
import ImageUpload, { CroppedImageData, blobToBase64 } from '@/components/ImageUpload';
import './ActorInfoForm.css';

export interface ActorData {
  name: string;
  imageBlob: Blob | null;
  imageBuffer: string | null;
}

export const DEFAULT_ACTOR_IMAGE = '/mystery-actor.png';

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
  const objectUrlsRef = useRef<string[]>([]);

  const [imagePreview, setImagePreview] = useState(DEFAULT_ACTOR_IMAGE);

  useEffect(() => {
    if (init.imageBlob) {
      const url = URL.createObjectURL(init.imageBlob);
      objectUrlsRef.current.push(url);
      setImagePreview(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
    objectUrlsRef.current.push(data.objectUrl);
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(data.objectUrl);
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
          imagePreview={imagePreview}
          hasImage={imageBlob !== null}
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
