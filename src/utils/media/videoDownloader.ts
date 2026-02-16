export interface DownloadOptions {
  videoUrl: string;
  videoName: string;
}

export interface DownloadResult {
  success: boolean;
  message?: string;
}

export async function downloadVideo(options: DownloadOptions): Promise<DownloadResult> {
  const { videoUrl, videoName } = options;

  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(ua);
  const isIOS = /iphone|ipad|ipod/.test(ua);

  // Android: copy link to clipboard (Phantom blocks downloads/external browser)
  if (isAndroid) {
    try {
      await navigator.clipboard.writeText(videoUrl);
      return {
        success: true,
        message: 'Link copied to clipboard. Paste it in your mobile browser to download.'
      };
    } catch {
      // Fallback for older browsers
      prompt('Copy this link:', videoUrl);
      return {
        success: true,
        message: 'Link copied (fallback method)'
      };
    }
  }

  const fileName = `${videoName}.mp4`;

  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();

    // iOS: use Share API (works in Phantom's in-app browser)
    if (isIOS && navigator.share && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'video/mp4' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: videoName,
        });
        return {
          success: true,
          message: 'Video shared successfully'
        };
      }
    }

    // Desktop: classic blob download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Download started'
    };
  } catch (err) {
    console.error('Download failed:', err);
    // Fallback: open in new tab
    window.open(videoUrl, '_blank');
    return {
      success: false,
      message: 'Download failed. Opening in new tab.'
    };
  }
}
