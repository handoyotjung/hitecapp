const fs = require('fs');
const { PNG } = require('pngjs');

const inputPath = 'C:/Users/Administrator/.gemini/antigravity/brain/72ece303-4643-4f3e-bccc-4e2216d6ed56/media__1783743407140.png';

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function () {
    // We will create two PNGs:
    // 1. White high-contrast version for dark background
    // 2. Original color with transparent background
    const whitePng = new PNG({ width: this.width, height: this.height });
    const originalPng = new PNG({ width: this.width, height: this.height });

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];
        const a = this.data[idx + 3];

        // Determine brightness
        const brightness = (r + g + b) / 3;

        // If background is white/light gray (> 215 brightness), make transparent
        if (brightness > 215) {
          whitePng.data[idx + 3] = 0;
          originalPng.data[idx + 3] = 0;
        } else {
          // Anti-aliased edge transition between 150 and 215
          let alpha = a;
          if (brightness > 150) {
            alpha = Math.round(((215 - brightness) / (215 - 150)) * 255);
          }

          // Original transparent
          originalPng.data[idx] = r;
          originalPng.data[idx + 1] = g;
          originalPng.data[idx + 2] = b;
          originalPng.data[idx + 3] = alpha;

          // High contrast bright white/cyan tinted for dark mode UI
          whitePng.data[idx] = 255;
          whitePng.data[idx + 1] = 255;
          whitePng.data[idx + 2] = 255;
          whitePng.data[idx + 3] = alpha;
        }
      }
    }

    whitePng.pack().pipe(fs.createWriteStream('public/logo-hs-white.png'));
    originalPng.pack().pipe(fs.createWriteStream('public/logo-hs-original.png'));
    console.log("Logos processed successfully!");
  });
