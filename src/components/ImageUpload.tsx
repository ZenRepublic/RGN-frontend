import { useState, useRef, ChangeEvent } from 'react';
import { ImageCropModal } from './ImageCropModal';
import { useToast } from '../context/ToastContext';
import { resizeImageForCropper, type CroppedImageData } from '../utils/media';

interface ImageUploadProps {
  defaultPreview: string;
  initialBlob?: Blob;
  onImageChange: (croppedImage: CroppedImageData) => void;
  inputId?: string;
}

export default function ImageUpload({
  defaultPreview,
  initialBlob,
  onImageChange,
  inputId,
}: ImageUploadProps) {
  // File input ref - needed to reset value after modal closes
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();
  const initialPreview = initialBlob ? URL.createObjectURL(initialBlob) : defaultPreview;
  const [imagePreview, setImagePreview] = useState(initialPreview);
  const [hasImage, setHasImage] = useState(!!initialBlob);

  // Cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelected = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB');
      return;
    }

    try {
      const resizedDataUrl = await resizeImageForCropper(file, 1024);
      setCropImage(resizedDataUrl);
      setCropModalOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process image. Please try again.';
      showToast(message);
    }
  };

  const handleCropConfirm = (croppedImageData: CroppedImageData) => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(croppedImageData.objectUrl);
    setHasImage(true);
    onImageChange(croppedImageData);

    // Clear crop state
    setCropModalOpen(false);
    setCropImage(null);
    resetFileInput();
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setCropImage(null);
    resetFileInput();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-sm">
        <img
          src={imagePreview}
          alt="Image"
          className="rounded-full w-[100px] object-cover border-lg border-yellow bg-black"
        />
        <button
          {...(inputId && { htmlFor: inputId })}
          className="special-small"
          onClick={() => fileInputRef.current?.click()}
        >
          {hasImage ? 'Change' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          {...(inputId && { id: inputId })}
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleImageSelected(e.target.files?.[0]);
          }}
          style={{ display: 'none' }}
        />
      </div>

      <ImageCropModal
        isOpen={cropModalOpen}
        imageSource={cropImage}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </>
  );
}
