import { useState, useCallback, ChangeEvent } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { createCroppedImage, type CroppedImageData } from '../utils/media';
import { Modal, Toast } from '@/primitives';
import './ImageCropModal.css';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSource: string | null;
  onConfirm: (croppedImage: CroppedImageData) => void;
  onCancel: () => void;
}

export function ImageCropModal({
  isOpen,
  imageSource,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  // Cropping state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageSource) return;

    try {
      const croppedImageData = await createCroppedImage(imageSource, croppedAreaPixels);

      // Revoke the cropper's source URL to free memory
      URL.revokeObjectURL(imageSource);

      onConfirm(croppedImageData);

      // Reset state for next use
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to crop image. Please try again.';
      setToastMessage(message);

      // Revoke URL even on error
      if (imageSource) URL.revokeObjectURL(imageSource);
    }
  };

  const handleClose = () => {
    // Revoke URL to free memory
    if (imageSource) URL.revokeObjectURL(imageSource);

    // Reset state
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    onCancel();
  };

  return (
    <Modal
      isOpen={isOpen && !!imageSource}
      onClose={handleClose}
      title="Crop Image"
    >
      <div className="crop-container">
        <Cropper
          image={imageSource!}
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

      <button className="primary crop-confirm-btn" onClick={handleConfirm}>
        Confirm
      </button>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
        />
      )}
    </Modal>
  );
}
