import ExcelJS from 'exceljs';
import JSZip from 'jszip';

// Replicate the fixOOXMLDrawingsExt logic used in exportXLSX
const fixOOXMLDrawingsExt = async (buffer, extents = []) => {
  const zip = await JSZip.loadAsync(buffer);
  const drawingFiles = Object.keys(zip.files).filter(name => /^xl\/drawings\/drawing\d+\.xml$/i.test(name));
  for (const drawingName of drawingFiles) {
    let drawingXml = await zip.file(drawingName).async("string");
    let picIndex = 0;
    drawingXml = drawingXml.replace(/<xdr:pic>[\s\S]*?<\/xdr:pic>/g, (picXml) => {
      const extObj = extents[picIndex] || { cx: 11430000, cy: 8572500 };
      picIndex++;
      return picXml.replace(/<xdr:spPr>([\s\S]*?)<a:ext\b[^>]*\/>/g, (match, before) => {
        return `<xdr:spPr>${before}<a:ext cx="${extObj.cx}" cy="${extObj.cy}"/>`;
      });
    });
    zip.file(drawingName, drawingXml);
  }
  return await zip.generateAsync({ type: "arraybuffer" });
};

async function runRegressionTest() {
  console.log("=== Running Excel (.xlsx) Embedded Photo Extents Regression Test ===");

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Inspection Report");

  // Create a minimal 1x1 red PNG base64 string
  const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  // Add two embedded photos to test multi-photo handling
  const img1 = workbook.addImage({ base64: minimalPngBase64, extension: 'png' });
  ws.addImage(img1, {
    tl: { col: 0, row: 3 },
    br: { col: 5, row: 17 },
    editAs: 'oneCell'
  });

  const img2 = workbook.addImage({ base64: minimalPngBase64, extension: 'png' });
  ws.addImage(img2, {
    tl: { col: 0, row: 25 },
    br: { col: 5, row: 39 },
    editAs: 'oneCell'
  });

  const rawBuffer = await workbook.xlsx.writeBuffer();

  // Suppose photo 1 is 1200x900 px and photo 2 is 800x600 px (at 96 DPI -> EMU = px * 9525)
  const simulatedExtents = [
    { cx: 1200 * 9525, cy: 900 * 9525 },
    { cx: 800 * 9525, cy: 600 * 9525 }
  ];

  const fixedBuffer = await fixOOXMLDrawingsExt(rawBuffer, simulatedExtents);

  // Unzip resulting fixed workbook buffer
  const zip = await JSZip.loadAsync(fixedBuffer);
  const drawingXml = await zip.file("xl/drawings/drawing1.xml").async("string");

  console.log("\nInspecting generated xl/drawings/drawing1.xml for <a:ext cx=\"...\" cy=\"...\"/>:");

  // Match all <a:ext cx="..." cy="..."/> tags inside <xdr:spPr>
  const extRegex = /<xdr:spPr>[\s\S]*?<a:ext\s+cx="(\d+)"\s+cy="(\d+)"\/>/g;
  let match;
  let count = 0;

  while ((match = extRegex.exec(drawingXml)) !== null) {
    count++;
    const cx = parseInt(match[1], 10);
    const cy = parseInt(match[2], 10);
    console.log(`  Embedded Photo #${count} -> cx=${cx} EMU, cy=${cy} EMU`);

    if (cx <= 0 || cy <= 0) {
      console.error(`❌ REGRESSION FAILURE: Picture #${count} has non-positive extents cx=${cx}, cy=${cy}`);
      process.exit(1);
    }
  }

  if (count !== 2) {
    console.error(`❌ REGRESSION FAILURE: Expected 2 embedded photos, found ${count}`);
    process.exit(1);
  }

  console.log("\n✅ REGRESSION TEST PASSED: All embedded pictures have strictly positive (> 0) OOXML cx/cy shape extents!");
}

runRegressionTest().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
