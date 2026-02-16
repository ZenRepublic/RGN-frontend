import { useState, useCallback, useRef, ChangeEvent } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { resizeImageForCropper, createCroppedImage, type CroppedImageData } from '../utils'
import './ImageUpload.css';

interface ImageUploadProps {
  defaultPreview: string;
  initialBlob?: Blob;
  onImageChange: (croppedImage: CroppedImageData) => void;
  onError: (message: string) => void;
  inputId: string;
}

export default function ImageUpload({
  defaultPreview,
  initialBlob,
  onImageChange,
  onError,
  inputId,
}: ImageUploadProps) {
  // File input ref - needed to reset value after modal closes
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialPreview = initialBlob ? URL.createObjectURL(initialBlob) : defaultPreview;
  const [imagePreview, setImagePreview] = useState(initialPreview);
  const [hasImage, setHasImage] = useState(!!initialBlob);

  // Cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError('Image must be smaller than 5MB');
      return;
    }

    try {
      const resizedDataUrl = await resizeImageForCropper(file, 1024);

      setCropImage(resizedDataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropModalOpen(true);
    } catch (err) {
      console.error('Failed to process image:', err);
      const message = err instanceof Error ? err.message : 'Failed to process image. Please try again.';
      onError(message);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !cropImage) return;

    try {
      const croppedImageData = await createCroppedImage(cropImage, croppedAreaPixels);

      // Revoke the cropper's source URL to free memory
      URL.revokeObjectURL(cropImage);

      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImagePreview(croppedImageData.objectUrl);
      setHasImage(true);
      onImageChange(croppedImageData);

      // Clear crop state
      setCropModalOpen(false);
      setCropImage(null);
      resetFileInput();
    } catch (err) {
      console.error('Crop failed:', err);
      onError('Failed to crop image. Please try again.');

      // Revoke URL even on error
      if (cropImage) URL.revokeObjectURL(cropImage);

      setCropModalOpen(false);
      setCropImage(null);
      resetFileInput();
    }
  };

  const handleCropCancel = () => {
    // Revoke URL to free memory
    if (cropImage) URL.revokeObjectURL(cropImage);

    setCropModalOpen(false);
    setCropImage(null);
    resetFileInput();
  };

  return (
    <>
      <div className="upload-image-container">
        <img
          src={imagePreview}
          alt="Image"
          className="upload-image"
        />
        <label htmlFor={inputId} className="upload-button">
          {hasImage ? 'Change' : 'Upload'}
        </label>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleImageUpload(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
      </div>

      {cropModalOpen && cropImage && (
        <div className="modal-overlay">
          <div className="crop-modal">
            <div className="modal-header">
              <h2>Crop Image</h2>
              <button
                  type="button"
                  className="modal-close"
                  onClick={handleCropCancel}
                  aria-label="Close"
                >
                  <img
                    src="/Icons/CloseIcon.PNG"
                    alt=""
                    className="modal-close-icon"
                  />
                </button>
            </div>

            <div className="crop-container">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="crop-controls">
              <label>Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setZoom(Number(e.target.value))}
                className="zoom-slider"
              />
            </div>

            <button className="primary crop-confirm-btn" onClick={handleCropConfirm}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  );
}
