import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak
} from 'docx';
import { saveAs } from 'file-saver';

// HELPER 1: 2 COLUMN TABLE (70% / 30%)
function createTwoColTable(label, value, labelColor, valueColor) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(label || ''),
                    color: "FFFFFF",
                    size: 22
                  })
                ]
              })
            ],
            shading: { fill: labelColor }
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(value || ''),
                    color: "FFFFFF",
                    bold: true,
                    size: 22
                  })
                ]
              })
            ],
            shading: { fill: valueColor }
          })
        ]
      })
    ]
  });
}

// HELPER 2: GET IMAGE SIZE FOR ASPECT RATIO
function getImageSize(bytes) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => resolve({ width: img.width || 500, height: img.height || 300 });
      img.onerror = () => resolve({ width: 500, height: 300 });
      const blob = new Blob([bytes]);
      img.src = URL.createObjectURL(blob);
    } catch {
      resolve({ width: 500, height: 300 });
    }
  });
}

// HELPER 3: DARK ROW & BULLET
function createDarkRow(text, bold = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text: String(text || ''),
        color: "FFFFFF",
        bold: bold,
        size: 22
      })
    ]
  });
}

function createDarkBullet(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: `- ${String(text || '')}`,
        color: "FFFFFF",
        size: 22
      })
    ]
  });
}

// HELPER 4: SAFE BASE64 TO BYTES
function base64ToBytes(base64Str) {
  if (!base64Str) return new Uint8Array();
  const parts = base64Str.split(',');
  const pureBase64 = parts.length > 1 ? parts[1] : base64Str;
  try {
    const binaryStr = atob(pureBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.warn("Error decoding base64:", e);
    return new Uint8Array();
  }
}

// HELPER 5: SAFE URL TO BASE64 CONVERTER IF BASE64 NOT CACHED
async function ensurePhotoBase64(photo) {
  if (photo.annotatedBase64) return photo.annotatedBase64;
  if (photo.base64) return photo.base64;
  const url = photo.localUrl || photo.url || photo.thumbnailUrl;
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export async function handleExportWord(project, queue = [], selectedPhotos = [], customFilename = null, viewMode = 'Desktop', returnBlob = false) {
  if (!project || !project.photos || project.photos.length === 0) return null;

  const docChildren = [];
  const isEnglish = !(project.language === 'ID' || project.language === 'Bahasa' || project.language === 'Bahasa Indonesia' || project.lang === 'ID');

  // Order exported photos strictly matching queue or selected list
  let photosToExport = project.photos || [];
  if (selectedPhotos && selectedPhotos.length > 0) {
    const orderedQueue = queue.filter(item =>
      item.status === 'Done' && selectedPhotos.includes(item.finalFilename)
    );
    if (orderedQueue.length > 0) {
      photosToExport = orderedQueue.map(item => {
        const matchedPhoto = project.photos.find(p => p.filename === item.finalFilename) || {};
        const rawBase = item.base64 || matchedPhoto.base64 || item.annotatedBase64 || '';
        return {
          ...matchedPhoto,
          ...item,
          filename: item.finalFilename,
          annotatedBase64: viewMode === 'Mobile' ? rawBase : (item.annotatedBase64 || matchedPhoto.annotatedBase64 || rawBase),
          base64: rawBase,
          localUrl: item.thumbnailUrl || matchedPhoto.url || ''
        };
      });
    } else {
      const filtered = photosToExport.filter(p => selectedPhotos.includes(p.filename));
      if (filtered.length > 0) photosToExport = filtered;
    }
  }

  // Use for...of loop to avoid UI hangs
  for (const photo of photosToExport) {
    // 1. GET IMAGE DIMENSIONS FOR ASPECT RATIO
    const rawBase64 = viewMode === 'Mobile' ? (photo.base64 || await ensurePhotoBase64(photo)) : (photo.annotatedBase64 || photo.base64 || await ensurePhotoBase64(photo));
    const imgData = base64ToBytes(rawBase64);
    const { width, height } = await getImageSize(imgData);
    const maxWidth = 500;
    const ratio = (width > 0 && height > 0) ? (height / width) : 0.6;
    const finalWidth = Math.min(width || maxWidth, maxWidth);
    const finalHeight = Math.round(finalWidth * ratio);

    const gradeShort = photo.grade ? photo.grade.split(' - ')[0] : 'F2';

    // 2. BUILD CONTENT FOR 1 PHOTO
    const photoContent = [];

    // IMAGE
    if (imgData && imgData.length > 0) {
      const imgType = (imgData[0] === 0x89 && imgData[1] === 0x50) ? "png" : "jpg";
      photoContent.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgData,
              transformation: { width: finalWidth, height: finalHeight },
              type: imgType
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );
    }

    const filenameText = photo.title || photo.asset_title || photo.filename || 'IMG.jpg';
    const dateText = photo.date || new Date().toISOString().split('T')[0];
    const standardsText = photo.standards || photo.standard || '-';
    const locationText = photo.location || project.location || 'Site';

    photoContent.push(createDarkRow(`${filenameText}, ${dateText}`, true));

    if (viewMode !== 'Mobile') {
      photoContent.push(createDarkRow(`Standard references ${standardsText}`));
      photoContent.push(createDarkRow(`Location: ${locationText}`, true));

      photoContent.push(createDarkRow(isEnglish ? "Comments:" : "KOMENTAR:", true));
      const komLines = typeof (photo.komentar || photo.caption || photo.observation) === 'string'
        ? (photo.komentar || photo.caption || photo.observation).split('\n').map(l => l.trim()).filter(Boolean)
        : [];
      const finalKomLines = komLines.length > 0 ? komLines : ["No comments noted."];
      finalKomLines.forEach(line => {
        if (line) photoContent.push(createDarkBullet(line));
      });

      // GRADE TABLE 70/30
      photoContent.push(
        createTwoColTable(
          isEnglish ? "Grades Priority" : "Tingkat Prioritas",
          gradeShort,
          "404040",
          "7A7A00"
        )
      );

      photoContent.push(createDarkRow(isEnglish ? "Recommendation:" : "REKOMENDASI:", true));
      let recs = photo.rekomendasi || photo.recommendation || photo.recommendations_json || photo.recommendations;
      if (typeof recs === 'string') {
        recs = recs.split('\n').map(r => r.trim()).filter(Boolean);
      }
      if (!Array.isArray(recs) || recs.length === 0) {
        recs = [photo.rekomendasi || photo.recommendation || "No recommendation noted."];
      }
      recs.forEach(line => {
        if (line) photoContent.push(createDarkBullet(line));
      });

      // STATUS TABLE 70/30
      photoContent.push(
        createTwoColTable(
          isEnglish ? "Latest status" : "Status Terbaru",
          "Open",
          "404040",
          "404040"
        )
      );
    }

    // 3. WRAP EVERYTHING IN 1 DARK CONTAINER TABLE WITH 10PT PADDING
    const containerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: photoContent,
              shading: { fill: "2B2B2B" },
              margins: { top: 144, bottom: 144, left: 144, right: 144 } // ~10pt padding
            })
          ]
        })
      ]
    });
    docChildren.push(containerTable);

    if (photo !== photosToExport[photosToExport.length - 1]) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (project.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = customFilename || `Hitec_Report_${safeName}.docx`;
  if (returnBlob) {
    return { blob, filename };
  }
  saveAs(blob, filename);
}
