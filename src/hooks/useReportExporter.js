import { useState, useCallback } from 'react';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  ImageRun
} from 'docx';
import { saveAs } from 'file-saver';
import { getBestPhotoBase64 } from '../exportWordReport';

// ============================================================
// REPORT EXPORT HOOK — isolates all export engines (Word, PDF, PPTX)
// Ensures pure Firestore-driven data with zero local mock fallback
// ============================================================

/**
 * Extracts photo data from project/queue for export
 * @param {Object} project - Firestore project doc with photos array
 * @param {Array} queue - Upload queue with Done items
 * @param {Array} [selectedPhotos] - Explicitly selected photos to export
 * @returns {Array} Normalized photo objects with base64 data
 */
const extractPhotosForExport = (project, queue, selectedPhotos) => {
  if (!project || !project.photos || project.photos.length === 0) return [];

  const orderedQueue = queue.filter(item =>
    item.status === 'Done' && (!selectedPhotos || selectedPhotos.length === 0 || selectedPhotos.includes(item.finalFilename))
  );

  let photosToExport = [...project.photos];

  if (orderedQueue.length > 0) {
    const queueFilenames = new Set(orderedQueue.map(q => q.finalFilename));
    const fallbackPhotos = (project.photos || []).filter(p =>
      !queueFilenames.has(p.filename) && (!selectedPhotos || selectedPhotos.length === 0 || selectedPhotos.includes(p.filename))
    );
    photosToExport = [
      ...orderedQueue.map(item => {
        const matchedPhoto = (project.photos || []).find(p => p.filename === item.finalFilename) || {};
        const rawBase = item.base64 || matchedPhoto.base64 || item.annotatedBase64 || matchedPhoto.annotatedBase64 || item.thumbnailUrl || matchedPhoto.url || '';
        return {
          ...matchedPhoto,
          ...item,
          filename: item.finalFilename,
          annotatedBase64: rawBase,
          base64: rawBase,
          localUrl: item.thumbnailUrl || matchedPhoto.url || ''
        };
      }),
      ...fallbackPhotos
    ];
  } else if (selectedPhotos && selectedPhotos.length > 0) {
    photosToExport = photosToExport.filter(p => selectedPhotos.includes(p.filename));
  }

  return photosToExport;
};

/**
 * EXPORT ENGINE: Word Document
 * Generates a .docx report from project photos with full formatting
 */
export const useExportWord = (project, queue, selectedPhotos) => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResult, setExportResult] = useState(null);

  const exportWord = useCallback(async (customFilename = null, viewMode = 'Desktop') => {
    if (!project || !project.photos || project.photos.length === 0) {
      setExportError('No photos available for export');
      return null;
    }

    setExporting(true);
    setExportError(null);

    try {
      const photosToExport = extractPhotosForExport(project, queue, selectedPhotos);

      if (photosToExport.length === 0) {
        setExportError('No photos selected for export');
        return null;
      }

      const docChildren = [];
      const isEnglish = !(project.language === 'ID' || project.language === 'Bahasa' || project.language === 'Bahasa Indonesia' || project.lang === 'ID');

      // Order exported photos strictly matching queue or selected list
      let photosExported = photosToExport;

      // Use for loop with index to manage 2 photos per page in Mobile mode
      for (let idx = 0; idx < photosExported.length; idx++) {
        const photo = photosExported[idx];

        // 1. GET IMAGE DIMENSIONS FOR ASPECT RATIO
        const rawBase64 = await getBestPhotoBase64(photo);
        const imgData = await base64ToBytes(rawBase64);
        const { width, height } = await getImageSize(imgData);

        if (viewMode === 'Mobile') {
          if (imgData && imgData.length > 0) {
            const imgType = (imgData[0] === 0x89 && imgData[1] === 0x50) ? "png" : "jpg";
            const mobileMaxWidth = 500;
            const mobileMaxHeight = 320;
            const ratio = (width > 0 && height > 0) ? (height / width) : 0.6;
            let mobileFinalWidth = Math.min(width || mobileMaxWidth, mobileMaxWidth);
            let mobileFinalHeight = Math.round(mobileFinalWidth * ratio);

            if (mobileFinalHeight > mobileMaxHeight) {
              mobileFinalHeight = mobileMaxHeight;
              mobileFinalWidth = Math.round(mobileFinalHeight / ratio);
            }

            const isOddIndex = idx % 2 === 1; // 2nd photo on the current page
            docChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imgData,
                    transformation: { width: mobileFinalWidth, height: mobileFinalHeight },
                    type: imgType
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 }
              })
            );

            const captionText = photo.caption || photo.title || photo.asset_title || photo.comments_text || photo.comments || "";
            if (captionText && captionText.trim() !== "") {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: captionText.trim(),
                      color: "1E293B",
                      size: 20
                    })
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: isOddIndex ? 0 : 280 }
                })
              );
            }
          }
        } else {
          const maxWidth = 500;
          const ratio = (width > 0 && height > 0) ? (height / width) : 0.6;
          const finalWidth = Math.min(width || maxWidth, maxWidth);
          const finalHeight = Math.round(finalWidth * ratio);

          const gradeShort = photo.grade ? photo.grade.split(' - ')[0] : 'F2';

          // BUILD CONTENT FOR 1 PHOTO
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

          const filenameText = photo.caption || photo.title || photo.asset_title || photo.filename || 'IMG.jpg';
          const dateText = photo.date || new Date().toISOString().split('T')[0];
          const standardsText = photo.standards || photo.standard || '-';
          const locationText = photo.location || project.location || 'Site';

          photoContent.push(createLightRow(`${filenameText}, ${dateText}`, true, "0F172A"));
          photoContent.push(createLightRow(`Standard references: ${standardsText}`, false, "334155"));
          photoContent.push(createLightRow(`Location: ${locationText}`, true, "0F172A"));

          photoContent.push(createLightRow(isEnglish ? "Comments:" : "KOMENTAR:", true, "C00000"));
          const komLines = typeof (photo.comments_text || photo.comments || photo.komentar || photo.observation) === 'string'
            ? (photo.comments_text || photo.comments || photo.komentar || photo.observation).split('\n').map(l => l.trim()).filter(Boolean)
            : [];
          const finalKomLines = komLines.length > 0 ? komLines : ["No comments noted."];
          finalKomLines.forEach(line => {
            if (line) photoContent.push(createLightBullet(line));
          });

          // GRADE TABLE 70/30 - WHITE PAPER THEME
          photoContent.push(
            createTwoColTable(
              isEnglish ? "Grades Priority" : "Tingkat Prioritas",
              gradeShort,
              "F1F5F9",
              "FEF3C7"
            )
          );

          photoContent.push(createLightRow(isEnglish ? "Recommendation:" : "REKOMENDASI:", true, "1F4E79"));
          let recs = photo.rekomendasi || photo.recommendation || photo.recommendations_json || photo.recommendations;
          if (typeof recs === 'string') {
            recs = recs.split('\n').map(r => r.trim()).filter(Boolean);
          }
          if (!Array.isArray(recs) || recs.length === 0) {
            recs = [photo.rekomendasi || photo.recommendation || "No recommendation noted."];
          }
          recs.forEach(line => {
            if (line) photoContent.push(createLightBullet(line));
          });

          // STATUS TABLE 70/30 - WHITE PAPER THEME
          photoContent.push(
            createTwoColTable(
              isEnglish ? "Latest status" : "Status Terbaru",
              "Open",
              "F1F5F9",
              "DCFCE7"
            )
          );

          // WRAP EVERYTHING IN CLEAN WHITE PAPER CONTAINER TABLE WITH 10PT PADDING
          const containerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: photoContent,
                    shading: { fill: "FFFFFF" },
                    margins: { top: 144, bottom: 144, left: 144, right: 144 } // ~10pt padding
                  })
                ]
              })
            ]
          });
          docChildren.push(containerTable);
        }

        if (idx < photosExported.length - 1) {
          if (viewMode === 'Mobile') {
            // In mobile mode, insert PageBreak only after every 2nd photo (idx === 1, 3, 5...)
            if (idx % 2 === 1) {
              docChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }
          } else {
            // In desktop mode, insert PageBreak after every photo
            docChildren.push(new Paragraph({ children: [new PageBreak()] }));
          }
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
        const result = { blob, filename };
        setExportResult(result);
        return result;
      }

      saveAs(blob, filename);
      setExportResult({ blob, filename });
      return { blob, filename };

    } catch (err) {
      console.error("Word export error:", err);
      setExportError(err instanceof Error ? err.message : 'Word export failed');
      return null;
    } finally {
      setExporting(false);
    }
  }, [project, queue, selectedPhotos]);

  const base64ToBytes = async (base64Str) => {
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
  };

  return { exportWord, exporting, exportError, exportResult };
};

/**
 * EXPORT ENGINE: PDF Document
 * Placeholder — PDF export engine to be implemented
 */
export const useExportPDF = () => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResult, setExportResult] = useState(null);

  const exportPDF = useCallback(async (project, selectedPhotos) => {
    setExporting(true);
    setExportError(null);

    try {
      // TODO: Implement PDF export using a library like pdfkit or react-pdf
      setExportError('PDF export not yet implemented — use useExportWord for DOCX generation');
      return null;
    } catch (err) {
      console.error("PDF export error:", err);
      setExportError(err instanceof Error ? err.message : 'PDF export failed');
      return null;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPDF, exporting, exportError, exportResult };
};

/**
 * EXPORT ENGINE: PPTX Document
 * Placeholder — PPTX export engine to be implemented
 */
export const useExportPPTX = () => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResult, setExportResult] = useState(null);

  const exportPPTX = useCallback(async (project, selectedPhotos) => {
    setExporting(true);
    setExportError(null);

    try {
      // TODO: Implement PPTX export using a library like pptxgenjs
      setExportError('PPTX export not yet implemented — use useExportWord for DOCX generation');
      return null;
    } catch (err) {
      console.error("PPTX export error:", err);
      setExportError(err instanceof Error ? err.message : 'PPTX export failed');
      return null;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPPTX, exporting, exportError, exportResult };
};

/**
 * Supporting utilities extracted from exportWordReport.js
 */

const createTwoColTable = (label, value, labelBg = "F1F5F9", valueBg = "E2E8F0") => {
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
                    color: "1E293B",
                    bold: true,
                    size: 20
                  })
                ]
              })
            ],
            shading: { fill: labelBg },
            margins: { top: 72, bottom: 72, left: 100, right: 100 }
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(value || ''),
                    color: "0F172A",
                    bold: true,
                    size: 20
                  })
                ]
              })
            ],
            shading: { fill: valueBg },
            margins: { top: 72, bottom: 72, left: 100, right: 100 }
          })
        ]
      })
    ]
  });
};

const getImageSize = async (bytes) => {
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
};

const createLightRow = (text, bold = false, color = "1E293B") => {
  return new Paragraph({
    children: [
      new TextRun({
        text: String(text || ''),
        color: color,
        bold: bold,
        size: 22
      })
    ],
    spacing: { before: 40, after: 40 }
  });
};

const createLightBullet = (text, color = "334155") => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${String(text || '')}`,
        color: color,
        size: 20
      })
    ],
    spacing: { before: 30, after: 30 }
  });
};

export { createTwoColTable, getImageSize, createLightRow, createLightBullet };