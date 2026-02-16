import { isHeic } from 'heic-to';

export interface CroppedImageData {
  blob: Blob;
  objectUrl: string;
}

// Helper to load image
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export async function resizeImageForCropper(
  file: File,
  maxSize: number = 800
): Promise<string> {
  // HEIC guard (keep your existing policy)
  if (await isHeic(file)) {
    throw new Error('HEIC/HEIF files are not supported');
  }

  let canvas: HTMLCanvasElement | null = null;
  let objectUrl: string | null = null;

  try {
    objectUrl = URL.createObjectURL(file);

    // ⚠️ DO NOT use createImageBitmap on iOS
    const img = await createImage(objectUrl);

    const { naturalWidth, naturalHeight } = img;

    const scale = Math.min(
      maxSize / naturalWidth,
      maxSize / naturalHeight,
      1
    );

    const targetWidth = Math.round(naturalWidth * scale);
    const targetHeight = Math.round(naturalHeight * scale);

    canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Convert to Blob (NOT base64)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas!.toBlob(
        b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.8
      );
    });

    // HARD cleanup before returning
    canvas.width = 0;
    canvas.height = 0;
    img.src = '';

    // Return object URL for cropper
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('resizeImageForCropper failed:', err);
    throw err;
  } finally {
    // Always revoke the original file URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export async function createCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<CroppedImageData> {
  const image = await createImage(imageSrc);

  const OUTPUT_SIZE = 512;
  const canvas = document.createElement('canvas');
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

  // Convert canvas → Blob (NO base64 - much more memory efficient on iOS)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.85
    );
  });

  // HARD cleanup to free memory immediately
  canvas.width = 0;
  canvas.height = 0;
  image.src = '';

  // Return blob + object URL for display (no base64 conversion!)
  return {
    blob,
    objectUrl: URL.createObjectURL(blob)
  };
}

// Export for use when uploading to backend
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
