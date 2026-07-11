const fs = require('fs');
const { PNG } = require('pngjs');

const inputPath = 'C:/Users/Administrator/.gemini/antigravity/brain/72ece303-4643-4f3e-bccc-4e2216d6ed56/media__1783743407140.png';

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function () {
    const whitePng = new PNG({ width: this.width, height: this.height });
    const originalPng = new PNG({ width: this.width, height: this.height });

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];
        const a = this.data[idx + 3];

        const brightness = (r + g + b) / 3;

        if (brightness > 215) {
          whitePng.data[idx + 3] = 0;
          originalPng.data[idx + 3] = 0;
        } else {
          let alpha = a;
          if (brightness > 150) {
            alpha = Math.round(((215 - brightness) / (215 - 150)) * 255);
          }

          originalPng.data[idx] = r;
          originalPng.data[idx + 1] = g;
          originalPng.data[idx + 2] = b;
          originalPng.data[idx + 3] = alpha;

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
