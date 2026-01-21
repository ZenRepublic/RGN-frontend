import { useState, useCallback, useRef, ChangeEvent } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { isHeic } from 'heic-to';
import './ImageUpload.css';

interface ImageUploadProps {
  imagePreview: string;
  hasImage: boolean;
  onImageChange: (croppedImage: string) => void;
  onError: (message: string) => void;
  inputId: string;
}

// Helper to load image
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function resizeImageForCropper(
  file: File,
  maxSize: number = 800
): Promise<string> {
  let workingBlob: Blob = file;

  // Step 1: Detect & convert HEIC → JPEG Blob (prevents crash)
  // Note: HEIC is blocked before this function is called, but keep as safety net
  if (await isHeic(file)) {
    throw new Error('HEIC/HEIF files are not supported');
  }

  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    if ('createImageBitmap' in window) {
      bitmap = await createImageBitmap(workingBlob, {
        resizeQuality: 'medium',
      });

      const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
      const targetWidth = Math.round(bitmap.width * scale);
      const targetHeight = Math.round(bitmap.height * scale);

      canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      return await new Promise<string>((resolve, reject) => {
        canvas!.toBlob((blob) => {
          if (!blob) return reject(new Error('Failed to create blob'));
          resolve(URL.createObjectURL(blob));
        }, 'image/jpeg', 0.8);
      });
    }

    // Fallback: Image element
    const url = URL.createObjectURL(workingBlob);
    const img = await createImage(url);
    URL.revokeObjectURL(url);

    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return await new Promise<string>((resolve, reject) => {
      canvas!.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to create blob'));
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.8);
    });
  } catch (err) {
    console.error('resizeImageForCropper failed:', err);
    throw err;
  } finally {
    if (bitmap) bitmap.close();
    if (canvas) {
      canvas.width = canvas.height = 0;
    }
  }
}

async function createCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  let image: HTMLImageElement | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    image = await createImage(imageSrc);

    canvas = document.createElement('canvas');
    const OUTPUT_SIZE = 512;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    const result = canvas.toDataURL('image/jpeg', 0.85);
    return result;
  } catch (error) {
    console.error('createCroppedImage failed:', error);
    throw error;
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    if (image) image.src = '';
  }
}

export default function ImageUpload({
  imagePreview,
  hasImage,
  onImageChange,
  onError,
  inputId,
}: ImageUploadProps) {
  // File input ref - needed to reset value after modal closes
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (await isHeic(file)) {
      onError(
        'HEIC/HEIF files are not supported. ' +
        'Please convert to JPEG/PNG first (in Photos app: Edit → tiny crop → Done).'
      );
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
      onError('Failed to process image. Please try a smaller image.');
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
      const croppedImage = await createCroppedImage(cropImage, croppedAreaPixels);
      onImageChange(croppedImage);

      // Clear crop state
      setCropModalOpen(false);
      setCropImage(null);
      resetFileInput();
    } catch (err) {
      console.error('Crop failed:', err);
      onError('Failed to crop image. Please try again.');
      setCropModalOpen(false);
      setCropImage(null);
      resetFileInput();
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setCropImage(null);
    resetFileInput();
  };

  return (
    <>
      <div className="fighter-image-container">
        <img
          src={imagePreview}
          alt="Fighter"
          className="fighter-image"
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
