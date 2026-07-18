/**
 * Client-side image compression utility using HTML5 Canvas.
 * Dynamically compresses and downscales high-resolution mobile photos (2MB - 8MB)
 * to stay strictly below the backend restriction of 300KB per photo.
 * Maintains a balanced resolution and compression quality (JPEG quality around 0.7 - 0.8)
 * so images remain clear enough for the raw photo report while respecting the maximum size barrier.
 */

export async function compressImage(file, maxKb = 290) {
  // If not an image or invalid, return immediately
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // If already below target limit (e.g., <= 290 KB), no need to compress unless we want to normalize format
  const initialSizeKb = file.size / 1024;
  if (initialSizeKb <= maxKb && initialSizeKb <= 290) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Initial downscaling constraint for high-res mobile photos (> 2048px -> balanced 1920px)
      const initialMaxDim = 1920;
      if (width > initialMaxDim || height > initialMaxDim) {
        if (width > height) {
          height = Math.round((height * initialMaxDim) / width);
          width = initialMaxDim;
        } else {
          width = Math.round((width * initialMaxDim) / height);
          height = initialMaxDim;
        }
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Iterative compression loop parameters
      let currentWidth = width;
      let currentHeight = height;
      let currentQuality = 0.8; // start around 0.8 per specifications
      const minQuality = 0.35;
      const minDimension = 500;

      const attemptCompression = () => {
        canvas.width = currentWidth;
        canvas.height = currentHeight;

        // Clear and draw image with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, currentWidth, currentHeight);
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to original file if canvas conversion fails
              resolve(file);
              return;
            }

            const blobSizeKb = blob.size / 1024;

            // If strictly below target size barrier (maxKb) OR reached minimum quality/dimensions
            if (blobSizeKb <= maxKb || (currentQuality <= minQuality && currentWidth <= minDimension)) {
              // Convert Blob back to a clean File object preserving original filename and lastModified
              const finalFilename = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const compressedFile = new File([blob], finalFilename, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              // Adjust parameters for next iteration: lower quality by 0.08, or downscale resolution by 15%
              if (currentQuality > minQuality) {
                currentQuality = Math.max(minQuality, Number((currentQuality - 0.08).toFixed(2)));
              } else if (currentWidth > minDimension && currentHeight > minDimension) {
                currentWidth = Math.round(currentWidth * 0.85);
                currentHeight = Math.round(currentHeight * 0.85);
                currentQuality = 0.75; // reset quality slightly when downscaling resolution
              } else {
                // If stuck below both thresholds, return current blob as File
                const finalFilename = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                const compressedFile = new File([blob], finalFilename, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              }
              attemptCompression();
            }
          },
          'image/jpeg',
          currentQuality
        );
      };

      attemptCompression();
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn("Failed to load image for client compression, returning original file:", err);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
