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

// SAFE BASE64 TO BYTES CONVERTER
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

// SAFE URL TO BASE64 CONVERTER IF BASE64 NOT CACHED
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

// HELPER FUNCTIONS FOR WORD DOCX STRUCTURE
function createDarkRow(text, bold = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text: String(text || ''),
        color: "FFFFFF",
        bold: bold,
        size: 22
      })
    ],
    shading: {
      fill: "2B2B2B"
    }
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
    ],
    shading: {
      fill: "2B2B2B"
    }
  });
}

function createGradeTable(label, value) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
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
            shading: { fill: "404040" }
          }),
          new TableCell({
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
            shading: { fill: "7A7A00" }
          })
        ]
      })
    ]
  });
}

function createStatusTable(label, value) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
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
            shading: { fill: "404040" }
          }),
          new TableCell({
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
            shading: { fill: "404040" }
          })
        ]
      })
    ]
  });
}

export async function handleExportWord(project, queue = [], selectedPhotos = []) {
  if (!project || !project.photos || project.photos.length === 0) return;

  const docChildren = [];
  const isEnglish = project.language === 'English' || project.language === 'EN' || project.lang === 'EN';

  // Order exported photos strictly matching queue or selected list
  let photosToExport = project.photos || [];
  if (selectedPhotos && selectedPhotos.length > 0) {
    const orderedQueue = queue.filter(item =>
      item.status === 'Done' && selectedPhotos.includes(item.finalFilename)
    );
    if (orderedQueue.length > 0) {
      photosToExport = orderedQueue.map(item => {
        const matchedPhoto = project.photos.find(p => p.filename === item.finalFilename) || {};
        return {
          ...matchedPhoto,
          filename: item.finalFilename,
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
    const gradeShort = photo.grade ? photo.grade.split(' - ')[0] : 'F2';

    // 1. IMAGE (centered, full width 468x260)
    const rawBase64 = photo.annotatedBase64 || photo.base64 || await ensurePhotoBase64(photo);
    const imgBytes = base64ToBytes(rawBase64);

    if (imgBytes && imgBytes.length > 0) {
      const imgType = (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) ? "png" : "jpg";
      docChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgBytes,
              transformation: { width: 468, height: 260 },
              type: imgType
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );
    }

    const filenameText = photo.filename || 'IMG.jpg';
    const dateText = photo.date || new Date().toISOString().split('T')[0];
    const standardsText = photo.standards || photo.standard || 'ATEX Directive 2014/34/EU';
    const locationText = photo.location || photo.area || 'Site Area';
    const komentarText = photo.komentar || photo.caption || photo.observation || 'No comments';

    let recs = photo.rekomendasi || photo.recommendation || photo.recommendations_json || photo.recommendations;
    if (typeof recs === 'string') {
      recs = recs.split('\n').map(r => r.trim()).filter(Boolean);
    }
    if (!Array.isArray(recs) || recs.length === 0) {
      recs = [photo.rekomendasi || photo.recommendation || "No specific recommendation noted."];
    }

    // 2. TITLE: {filename}, {date}
    docChildren.push(createDarkRow(`${filenameText}, ${dateText}`, true));

    // 3. STANDARDS: Standard references {standards}
    docChildren.push(createDarkRow(`Standard references ${standardsText}`));

    // 4. LOCATION: Location: {location}
    docChildren.push(createDarkRow(`Location: ${locationText}`, true));

    // 5. KOMENTAR / COMMENTS
    docChildren.push(createDarkRow(isEnglish ? "Comments:" : "KOMENTAR:", true));
    const komLines = typeof komentarText === 'string'
      ? komentarText.split('\n').map(l => l.trim()).filter(Boolean)
      : [String(komentarText)];
    const finalKomLines = komLines.length > 0 ? komLines : ["No comments noted."];
    for (const line of finalKomLines) {
      docChildren.push(createDarkBullet(line));
    }

    // 6. GRADE TABLE
    docChildren.push(
      createGradeTable(isEnglish ? "Grades Priority" : "Tingkat Prioritas", gradeShort)
    );

    // 7. REKOMENDASI / RECOMMENDATION
    docChildren.push(createDarkRow(isEnglish ? "Recommendation:" : "REKOMENDASI:", true));
    for (const rec of recs) {
      docChildren.push(createDarkBullet(rec));
    }

    // 8. STATUS TABLE
    docChildren.push(createStatusTable(isEnglish ? "Latest status" : "Status Terbaru", "Open"));

    // 9. PAGE BREAK after each photo
    docChildren.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    );
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
  saveAs(blob, `Hitec_Report_${safeName}.docx`);
}
