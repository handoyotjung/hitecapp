import pptxgen from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PowerPoint Presentation (16:9 Widescreen)
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "PT. HITECSOLUTION TEKNOLOGI PRIMA - Company Profile 2026";
pres.author = "HITEC Technology Team";
pres.company = "PT. HITECSOLUTION TEKNOLOGI PRIMA";
pres.subject = "Integrated Technology & Smart Building System Integrator";

// Color Palette Constants
const C = {
  bgDark: "0A1628",       // Deep Midnight Tech Navy
  bgCardDark: "112240",   // Glass Navy Card
  bgCardDark2: "1E2D4A",  // Secondary Card Fill
  bgLight: "F8FAFC",      // Clean Crisp White/Slate
  bgCardLight: "FFFFFF",  // Card Light
  borderDark: "233554",   // Card Border
  borderCyan: "00ADB5",   // Cyan Border
  textWhite: "FFFFFF",    // Pure White
  textMuted: "94A3B8",    // Muted Slate Text
  textDark: "0F172A",     // Dark Navy Text
  cyan: "00C0FF",         // High Voltage Cyan
  cyanLight: "38BDF8",    // Sky Blue
  bluePrimary: "0284C7",  // Primary Brand Blue
  indigo: "6366F1",       // Security Indigo
  greenSolar: "10B981",   // Solar Emerald
  greenBg: "ECFDF5",      // Light Green BG
  amber: "F59E0B",        // Warning / Highlight Amber
  orange: "F97316",       // Fire / Sensor Orange
};

// Common Font Constants
const FONT_TITLE = "Segoe UI";
const FONT_BODY = "Segoe UI";

// =========================================================================
// SLIDE 1: TITLE & HERO COVER (Dark Tech Gradient)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  // Subtle background glow/accent box
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.15,
    fill: { color: C.cyan }
  });

  // Top Left Logo Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 0.7, w: 1.4, h: 1.4,
    rectRadius: 0.15,
    fill: { color: "0B2545" },
    line: { color: C.cyan, width: 2 }
  });
  slide.addText("HS\nHITEC", {
    x: 0.8, y: 0.7, w: 1.4, h: 1.4,
    fontFace: FONT_TITLE, fontSize: 16, bold: true, color: C.textWhite,
    align: "center", valign: "middle"
  });

  // Main Hero Heading
  slide.addText("Orchestrating the\nSmart Building of 2026.", {
    x: 0.8, y: 2.3, w: 11.5, h: 2.2,
    fontFace: FONT_TITLE, fontSize: 44, bold: true, color: C.textWhite,
    lineSpacingMultiple: 1.1
  });

  // Subtitle Pill / Header
  slide.addText("Integrated Technology & Smart Building System Integrator.", {
    x: 0.8, y: 4.6, w: 11.5, h: 0.8,
    fontFace: FONT_TITLE, fontSize: 22, bold: true, color: C.cyanLight
  });

  // Bottom Explanatory Paragraph
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 5.5, w: 11.7, h: 1.1,
    rectRadius: 0.1,
    fill: { color: "0F2942" },
    line: { color: "1E4976", width: 1 }
  });
  slide.addText("Eliminating vendor lock-in. Synchronizing multi-brand IT, Security, and Solar systems into a single intelligent management dashboard.", {
    x: 1.1, y: 5.55, w: 11.1, h: 1.0,
    fontFace: FONT_BODY, fontSize: 16, color: "E2E8F0",
    valign: "middle"
  });
}

// =========================================================================
// SLIDE 2: A FOUNDATION OF TRUST ➔ A FUTURE OF UNITY (Split Screen)
// =========================================================================
{
  const slide = pres.addSlide();

  // Left Half White BG
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 6.66, h: 6.0,
    fill: { color: C.bgLight }
  });

  // Right Half Dark Navy BG
  slide.addShape(pres.ShapeType.rect, {
    x: 6.66, y: 0, w: 6.67, h: 6.0,
    fill: { color: C.bgDark }
  });

  // Left Section (Past / Foundation)
  slide.addText("A Foundation of Trust", {
    x: 0.8, y: 0.8, w: 5.4, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: "1E3A8A"
  });
  slide.addText("Over 14 years of physical security systems experience", {
    x: 0.8, y: 1.4, w: 5.4, h: 0.5,
    fontFace: FONT_BODY, fontSize: 14, color: C.textDark
  });

  slide.addText([
    { text: "• Over 14 years of security systems experience\n\n", options: { bold: true, color: C.textDark } },
    { text: "• Uncompromising integrity, physical infrastructure mastery, and certified engineering", options: { color: "334155" } }
  ], {
    x: 0.8, y: 3.2, w: 5.2, h: 2.2,
    fontFace: FONT_BODY, fontSize: 14, lineSpacingMultiple: 1.2
  });

  // Right Section (Future / Unity)
  slide.addText("A Future of Unity", {
    x: 7.2, y: 0.8, w: 5.4, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: C.cyanLight
  });
  slide.addText("Evolving from a siloed security integrator to a holistic smart building architect", {
    x: 7.2, y: 1.4, w: 5.4, h: 0.6,
    fontFace: FONT_BODY, fontSize: 14, color: C.textMuted
  });

  slide.addText([
    { text: "• Evolving from a siloed security integrator to a holistic smart building architect\n\n", options: { bold: true, color: C.textWhite } },
    { text: "• 3 Pillars converging into 1 Unified Multi-Brand Dashboard", options: { color: C.cyanLight, bold: true } }
  ], {
    x: 7.2, y: 3.2, w: 5.2, h: 2.2,
    fontFace: FONT_BODY, fontSize: 14, lineSpacingMultiple: 1.2
  });

  // Center Arrow Transition Bar
  slide.addShape(pres.ShapeType.rightArrow, {
    x: 4.8, y: 2.2, w: 3.7, h: 0.7,
    fill: { color: C.bluePrimary },
    line: { color: C.cyan, width: 1.5 }
  });

  // Bottom Stats Bar (4 Equal Columns)
  const statsY = 6.0;
  const statsH = 1.5;
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: statsY, w: 13.33, h: statsH,
    fill: { color: "07111E" },
    line: { color: "1E293B", width: 1 }
  });

  const stats = [
    { num: "Since 2010", label: "Security Systems Experience" },
    { num: "500+", label: "Projects Delivered" },
    { num: "3 Pillars", label: "IT • Security • Solar" },
    { num: "1 Dashboard", label: "Unified Multi-Brand" }
  ];

  stats.forEach((st, i) => {
    const colW = 3.33;
    const colX = i * colW;
    slide.addText(st.num, {
      x: colX, y: statsY + 0.15, w: colW, h: 0.55,
      fontFace: FONT_TITLE, fontSize: 20, bold: true, color: C.cyanLight,
      align: "center"
    });
    slide.addText(st.label, {
      x: colX, y: statsY + 0.7, w: colW, h: 0.5,
      fontFace: FONT_BODY, fontSize: 12, color: C.textMuted,
      align: "center"
    });
    if (i < 3) {
      slide.addShape(pres.ShapeType.line, {
        x: colX + colW, y: statsY + 0.25, w: 0, h: 0.9,
        line: { color: "1E3A5F", width: 1 }
      });
    }
  });
}

// =========================================================================
// SLIDE 3: 3 PILLARS CONVERGENCE (Interactive Hub)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgLight };

  slide.addText("CONVERGENCE ARCHITECTURE", {
    x: 0.8, y: 0.4, w: 11.5, h: 0.4,
    fontFace: FONT_TITLE, fontSize: 13, bold: true, color: C.bluePrimary
  });
  slide.addText("3 Specialized Pillars Converged into 1 Operational Brain", {
    x: 0.8, y: 0.75, w: 11.5, h: 0.5,
    fontFace: FONT_TITLE, fontSize: 22, bold: true, color: C.textDark
  });

  // Circle 1: IT Solutions & Smart Automation (Top Left)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 3.6, h: 3.4,
    rectRadius: 0.2,
    fill: { color: "E0F2FE" },
    line: { color: "0284C7", width: 2 }
  });
  slide.addText("IT Solutions &\nSmart Automation", {
    x: 1.0, y: 1.7, w: 3.2, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 18, bold: true, color: "0369A1",
    align: "center"
  });
  slide.addText("• Enterprise Networking (Omada SDN)\n• Industrial OT Brokerage (SCADA/PLC)\n• Canary Labs Data Historian\n• Custom In-House Web Apps", {
    x: 1.0, y: 2.7, w: 3.2, h: 2.0,
    fontFace: FONT_BODY, fontSize: 13, color: "0C4A6E",
    lineSpacingMultiple: 1.2
  });

  // Circle 2: Security Systems & Access Control (Top Right)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 8.9, y: 1.5, w: 3.6, h: 3.4,
    rectRadius: 0.2,
    fill: { color: "EEF2FF" },
    line: { color: "4F46E5", width: 2 }
  });
  slide.addText("Security Systems\n& Access Control", {
    x: 9.1, y: 1.7, w: 3.2, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 18, bold: true, color: "4338CA",
    align: "center"
  });
  slide.addText("• Intelligent Video (Hikvision/VIGI)\n• Biometrics & Barrier Turnstiles (ZKTeco)\n• X-Ray Baggage & Walkthrough Detectors\n• Central Alarm Panels (Honeywell)", {
    x: 9.1, y: 2.7, w: 3.2, h: 2.0,
    fontFace: FONT_BODY, fontSize: 13, color: "312E81",
    lineSpacingMultiple: 1.2
  });

  // Circle 3: Solar Integration & Renewable Energy (Bottom Center)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.85, y: 3.5, w: 3.6, h: 3.4,
    rectRadius: 0.2,
    fill: { color: "ECFDF5" },
    line: { color: "059669", width: 2 }
  });
  slide.addText("Solar Integration\n& Renewable Energy", {
    x: 5.05, y: 3.7, w: 3.2, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 18, bold: true, color: "047857",
    align: "center"
  });
  slide.addText("• Turnkey Rooftop PV (3kW - 20kW+)\n• Solar Karya Indonesia (SKI Partner)\n• Mono PERC & Full-Black Architectural\n• Smart Hybrid Inverters & Durability", {
    x: 5.05, y: 4.7, w: 3.2, h: 2.0,
    fontFace: FONT_BODY, fontSize: 13, color: "064E3B",
    lineSpacingMultiple: 1.2
  });

  // Center Convergence Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.6, y: 1.7, w: 4.1, h: 1.4,
    rectRadius: 0.15,
    fill: { color: C.bgDark },
    line: { color: C.cyan, width: 2 }
  });
  slide.addText("1 DASHBOARD\nReal-Time Operational Intelligence", {
    x: 4.7, y: 1.8, w: 3.9, h: 1.2,
    fontFace: FONT_TITLE, fontSize: 15, bold: true, color: C.textWhite,
    align: "center", valign: "middle"
  });
}

// =========================================================================
// SLIDE 4: PILLAR 1: IT & AUTOMATION (Clean Light Theme)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgLight };

  slide.addText("PILLAR 1: IT & AUTOMATION", {
    x: 0.8, y: 0.6, w: 11.5, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: "0284C7"
  });

  // Left Card: Enterprise Networking & Software
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.5, w: 5.6, h: 5.2,
    rectRadius: 0.15,
    fill: { color: C.bgCardLight },
    line: { color: "BAE6FD", width: 2 }
  });
  slide.addText("Enterprise Networking\n& Software", {
    x: 1.1, y: 1.8, w: 5.0, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 20, bold: true, color: "0369A1"
  });
  slide.addText([
    { text: "• Commercial Networking: ", options: { bold: true, color: C.textDark } },
    { text: "TP-Link Omada SDN ecosystem (Wi-Fi 7/6 Access Points, L2+/L3 Managed PoE Switches, Multi-WAN VPN Gateways).\n\n", options: { color: "334155" } },
    { text: "• In-House Software Development: ", options: { bold: true, color: C.textDark } },
    { text: "Custom Web Applications, Google AppSheet rapid solutions, and automated Excel Mini-ERP business logic.", options: { color: "334155" } }
  ], {
    x: 1.1, y: 2.8, w: 5.0, h: 3.5,
    fontFace: FONT_BODY, fontSize: 14, lineSpacingMultiple: 1.2
  });

  // Right Card: Industrial OT Brokerage (via OTINOVA)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 6.9, y: 1.5, w: 5.6, h: 5.2,
    rectRadius: 0.15,
    fill: { color: C.bgCardLight },
    line: { color: "BAE6FD", width: 2 }
  });
  slide.addText("Industrial OT Brokerage\n(via OTINOVA)", {
    x: 7.2, y: 1.8, w: 5.0, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 20, bold: true, color: "0369A1"
  });
  slide.addText([
    { text: "• SCADA Systems: ", options: { bold: true, color: C.textDark } },
    { text: "AVEVA, HollySys industrial telemetry and supervisory control.\n\n", options: { color: "334155" } },
    { text: "• PLCs: ", options: { bold: true, color: C.textDark } },
    { text: "Rockwell Automation / Allen-Bradley industrial automation logic.\n\n", options: { color: "334155" } },
    { text: "• Data Management: ", options: { bold: true, color: C.textDark } },
    { text: "Canary Labs Enterprise Data Historian, ABB Continuous Emission Monitoring Systems (CEMS) Gas Analyzers.", options: { color: "334155" } }
  ], {
    x: 7.2, y: 2.8, w: 5.0, h: 3.5,
    fontFace: FONT_BODY, fontSize: 14, lineSpacingMultiple: 1.2
  });
}

// =========================================================================
// SLIDE 5: PILLAR 2: SECURITY & ACCESS CONTROL (Dark Tech Theme)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  slide.addText("PILLAR 2: SECURITY & ACCESS CONTROL", {
    x: 0.8, y: 0.6, w: 11.5, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: C.textWhite
  });

  const cols = [
    {
      title: "Intelligent Video\nSurveillance",
      desc: "Hikvision & VIGI IP cameras, ColorPro ultra-low light, License Plate Recognition (LPR), 4G LTE cameras, and Fisheye panoramic systems converged with Omada Central."
    },
    {
      title: "Biometric Access\n& Barriers",
      desc: "ZKTeco & Bostex advanced solutions. High-throughput facial recognition, contactless palm scanners, fingerprint readers, tripod turnstiles, and smart digital locks."
    },
    {
      title: "Intrusion &\nInspection",
      desc: "X-ray baggage scanners, walkthrough multi-zone metal detectors, and Honeywell central alarm control panels with automated zoning triggers."
    }
  ];

  cols.forEach((col, i) => {
    const cardX = 0.8 + i * 3.95;
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX, y: 1.5, w: 3.7, h: 4.2,
      rectRadius: 0.15,
      fill: { color: C.bgCardDark },
      line: { color: "1E3A5F", width: 1.5 }
    });
    slide.addText(col.title, {
      x: cardX + 0.25, y: 1.8, w: 3.2, h: 0.8,
      fontFace: FONT_TITLE, fontSize: 18, bold: true, color: C.cyanLight
    });
    slide.addText(col.desc, {
      x: cardX + 0.25, y: 2.8, w: 3.2, h: 2.6,
      fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1",
      lineSpacingMultiple: 1.25
    });
  });

  // Milestone Banner at Bottom
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 5.9, w: 11.7, h: 1.0,
    rectRadius: 0.1,
    fill: { color: "0B2545" },
    line: { color: C.cyan, width: 1 }
  });
  slide.addText("★ Proven Milestone Project: The ASEAN Secretariat (ASEC) SG Residence Integrated Security", {
    x: 1.0, y: 6.0, w: 11.3, h: 0.8,
    fontFace: FONT_TITLE, fontSize: 15, bold: true, color: C.cyanLight,
    valign: "middle"
  });
}

// =========================================================================
// SLIDE 6: PILLAR 3: SOLAR & RENEWABLE ENERGY (Clean Light Green Theme)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgLight };

  slide.addText("PILLAR 3: SOLAR & RENEWABLE ENERGY", {
    x: 0.8, y: 0.6, w: 11.5, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: "059669"
  });

  // Left Specs Table Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.4, w: 7.2, h: 5.4,
    rectRadius: 0.15,
    fill: { color: C.bgCardLight },
    line: { color: "A7F3D0", width: 2 }
  });

  const tableRows = [
    [
      { text: "Primary Partner:", options: { bold: true, color: "065F46", fill: "ECFDF5" } },
      { text: "Solar Karya Indonesia (SKI)", options: { bold: true, color: C.textDark } }
    ],
    [
      { text: "Turnkey Solutions:", options: { bold: true, color: "065F46", fill: "ECFDF5" } },
      { text: "SK PRIME — All-in-1 Tinggal ON.\nStandardized 3 kW to 20 kW complete rooftop PV turnkey packages.", options: { color: C.textDark } }
    ],
    [
      { text: "Module Lines:", options: { bold: true, color: "065F46", fill: "ECFDF5" } },
      { text: "• SK Standard (530W–550W Mono PERC Tier-1 Quality)\n• SK Black (440W–460W Full-Black Architectural Aesthetic)\n• SK Light & Flexible (Compact, curved, and Marine/RV)", options: { color: C.textDark } }
    ],
    [
      { text: "Guaranteed Durability:", options: { bold: true, color: "065F46", fill: "ECFDF5" } },
      { text: "25-Year Linear Power Warranty (≥84.8% power output at Year 25).\n2400 Pa wind resistance / 5400 Pa snow load structural rating.", options: { color: C.textDark } }
    ]
  ];

  slide.addTable(tableRows, {
    x: 1.0, y: 1.6, w: 6.8, h: 5.0,
    colW: [2.0, 4.8],
    border: { pt: 1, color: "D1FAE5" },
    fontFace: FONT_BODY, fontSize: 12
  });

  // Right Side Visual Highlight Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 8.3, y: 1.4, w: 4.2, h: 5.4,
    rectRadius: 0.15,
    fill: { color: "064E3B" },
    line: { color: "10B981", width: 2 }
  });

  slide.addText("Clean Energy\nTransformation", {
    x: 8.6, y: 1.8, w: 3.6, h: 0.9,
    fontFace: FONT_TITLE, fontSize: 22, bold: true, color: C.textWhite
  });
  slide.addText("Seamlessly feeding clean rooftop solar power directly into building telemetry.\n\n• Zero-export smart limits\n• Inverter telemetry integration\n• ROI & carbon offset dashboard", {
    x: 8.6, y: 2.8, w: 3.6, h: 3.5,
    fontFace: FONT_BODY, fontSize: 14, color: "A7F3D0",
    lineSpacingMultiple: 1.3
  });
}

// =========================================================================
// SLIDE 7: COLLABORATIVE NETWORK & ECOSYSTEM (Ecosystem Matrix)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  slide.addText("Maintained by a collaborative network of world-class technology providers.", {
    x: 0.8, y: 0.6, w: 11.7, h: 0.8,
    fontFace: FONT_TITLE, fontSize: 24, bold: true, color: C.textWhite,
    align: "center"
  });

  const ecoCols = [
    {
      title: "IT & OT Ecosystem",
      color: C.cyan,
      items: ["TP-Link Omada", "Robustel", "Phoenix Contact", "HP", "Dell", "Cisco", "AVEVA", "Rockwell Automation", "Canary Labs"]
    },
    {
      title: "Security Ecosystem",
      color: "818CF8",
      items: ["Hikvision", "VIGI", "ZKTeco", "Bostex", "Honeywell", "Dahua", "Uniview"]
    },
    {
      title: "Energy Ecosystem",
      color: C.greenSolar,
      items: ["Solar Karya Indonesia (SKI)"]
    }
  ];

  ecoCols.forEach((col, i) => {
    const cardX = 0.8 + i * 3.95;
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX, y: 1.6, w: 3.7, h: 5.1,
      rectRadius: 0.15,
      fill: { color: C.bgCardDark },
      line: { color: col.color, width: 1.5 }
    });

    // Column Header
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX + 0.2, y: 1.8, w: 3.3, h: 0.6,
      rectRadius: 0.1,
      fill: { color: "0B2545" }
    });
    slide.addText(col.title, {
      x: cardX + 0.2, y: 1.8, w: 3.3, h: 0.6,
      fontFace: FONT_TITLE, fontSize: 16, bold: true, color: col.color,
      align: "center", valign: "middle"
    });

    // Brand Items
    const itemsFormatted = col.items.map(it => `•  ${it}`).join("\n\n");
    slide.addText(itemsFormatted, {
      x: cardX + 0.3, y: 2.6, w: 3.1, h: 3.8,
      fontFace: FONT_BODY, fontSize: 13, bold: true, color: C.textWhite,
      lineSpacingMultiple: 1.15
    });
  });
}

// =========================================================================
// SLIDE 8: CORE VALUES & DIFFERENTIATORS (5-Node Hub)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  slide.addText("CORE ARCHITECTURAL VALUES", {
    x: 0.8, y: 0.4, w: 11.5, h: 0.4,
    fontFace: FONT_TITLE, fontSize: 13, bold: true, color: C.cyanLight,
    align: "center"
  });
  slide.addText("Engineering Excellence & Multi-Brand Independence", {
    x: 0.8, y: 0.75, w: 11.5, h: 0.5,
    fontFace: FONT_TITLE, fontSize: 22, bold: true, color: C.textWhite,
    align: "center"
  });

  // 4 Corner Cards
  const cards = [
    {
      x: 0.8, y: 1.5, w: 3.6, h: 2.3,
      title: "Software-Driven",
      desc: "Elevating standard physical hardware with real-time cloud analytics and automation."
    },
    {
      x: 8.9, y: 1.5, w: 3.6, h: 2.3,
      title: "Sustainability",
      desc: "Driving clean solar energy integration and smart power management for modern infrastructure."
    },
    {
      x: 0.8, y: 4.4, w: 3.6, h: 2.3,
      title: "Integrity",
      desc: "Transparent engineering, precise detailed design, and ethical standards across all client engagements."
    },
    {
      x: 8.9, y: 4.4, w: 3.6, h: 2.3,
      title: "Customer Success",
      desc: "Long-term partnerships backed by responsive, SLA-driven technical support."
    }
  ];

  cards.forEach(c => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x, y: c.y, w: c.w, h: c.h,
      rectRadius: 0.15,
      fill: { color: C.bgCardDark },
      line: { color: "1E3A5F", width: 1.5 }
    });
    slide.addText(c.title, {
      x: c.x + 0.2, y: c.y + 0.2, w: c.w - 0.4, h: 0.5,
      fontFace: FONT_TITLE, fontSize: 18, bold: true, color: C.cyanLight,
      align: "center"
    });
    slide.addText(c.desc, {
      x: c.x + 0.2, y: c.y + 0.75, w: c.w - 0.4, h: c.h - 0.9,
      fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1",
      align: "center"
    });
  });

  // Center Hero Circle: Multi-Brand Mastery
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.85, y: 2.4, w: 3.6, h: 2.8,
    rectRadius: 0.2,
    fill: { color: "0B2545" },
    line: { color: C.cyan, width: 2.5 }
  });
  slide.addText("Multi-Brand\nMastery", {
    x: 5.0, y: 2.6, w: 3.3, h: 0.8,
    fontFace: FONT_TITLE, fontSize: 20, bold: true, color: C.textWhite,
    align: "center"
  });
  slide.addText("Vendor-agnostic freedom — selecting optimal hardware tailored strictly to client operational needs.", {
    x: 5.0, y: 3.5, w: 3.3, h: 1.5,
    fontFace: FONT_BODY, fontSize: 13, color: C.cyanLight,
    align: "center"
  });
}

// =========================================================================
// SLIDE 9: HITEC EDGE BROKER ARCHITECTURE (Data Pipeline)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  slide.addText("EDGE TELEMETRY PIPELINE", {
    x: 0.8, y: 0.4, w: 11.5, h: 0.4,
    fontFace: FONT_TITLE, fontSize: 13, bold: true, color: C.cyanLight
  });
  slide.addText("Zero Ecosystem Lock-In: Normalized Edge Telemetry", {
    x: 0.8, y: 0.75, w: 11.5, h: 0.5,
    fontFace: FONT_TITLE, fontSize: 22, bold: true, color: C.textWhite
  });

  // Multi-Protocol Input Chevrons (Left Side)
  const protocols = [
    { name: "Modbus RTU/TCP from Solar", color: C.cyan },
    { name: "ONVIF / RTSP from IP Cameras", color: "059669" },
    { name: "TCP/IP & Wiegand Access Control", color: "6366F1" },
    { name: "Contact Relays from Fire Panels", color: C.orange }
  ];

  protocols.forEach((p, i) => {
    const yPos = 1.6 + i * 0.95;
    slide.addShape(pres.ShapeType.rightArrow, {
      x: 0.8, y: yPos, w: 3.6, h: 0.75,
      fill: { color: p.color }
    });
    slide.addText(p.name, {
      x: 0.9, y: yPos, w: 3.1, h: 0.75,
      fontFace: FONT_TITLE, fontSize: 12, bold: true, color: C.textWhite,
      valign: "middle"
    });
  });

  // Center Node: HITEC Edge Broker
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.8, y: 1.6, w: 3.7, h: 3.6,
    rectRadius: 0.2,
    fill: { color: "0F2942" },
    line: { color: C.cyan, width: 2 }
  });
  slide.addText("HITEC Edge Broker", {
    x: 5.0, y: 2.0, w: 3.3, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 20, bold: true, color: C.textWhite,
    align: "center"
  });
  slide.addText("2.3 TOPS NPU | Real-Time Linux", {
    x: 5.0, y: 2.6, w: 3.3, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, bold: true, color: C.cyanLight,
    align: "center"
  });
  slide.addText("• Normalizes raw proprietary protocols\n• Buffers offline data during outages\n• Edge encryption & zero-trust auth", {
    x: 5.0, y: 3.1, w: 3.3, h: 1.8,
    fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1"
  });

  // Right Cloud Destination
  slide.addShape(pres.ShapeType.roundRect, {
    x: 8.9, y: 2.2, w: 3.6, h: 2.4,
    rectRadius: 0.2,
    fill: { color: "1E293B" },
    line: { color: "38BDF8", width: 1.5 }
  });
  slide.addText("Google Cloud\nPlatform (GCP)", {
    x: 9.1, y: 2.6, w: 3.2, h: 0.8,
    fontFace: FONT_TITLE, fontSize: 20, bold: true, color: C.textWhite,
    align: "center"
  });
  slide.addText("Standardized, secure telemetry stream powering live web dashboards.", {
    x: 9.1, y: 3.4, w: 3.2, h: 1.0,
    fontFace: FONT_BODY, fontSize: 12, color: C.textMuted,
    align: "center"
  });

  // Bottom Banner
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 5.6, w: 11.7, h: 1.2,
    rectRadius: 0.1,
    fill: { color: "0B2545" },
    line: { color: C.cyan, width: 1 }
  });
  slide.addText("You are no longer locked into one manufacturer's ecosystem.\nWe normalize the data so you own the dashboard.", {
    x: 1.0, y: 5.65, w: 11.3, h: 1.1,
    fontFace: FONT_TITLE, fontSize: 17, bold: true, color: C.textWhite,
    align: "center", valign: "middle"
  });
}

// =========================================================================
// SLIDE 10: PREMIUM, EXECUTIVE-READY SYNTHESIS (Dashboard Showcase)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  slide.addText("PREMIUM, EXECUTIVE-READY SYNTHESIS", {
    x: 0.8, y: 0.5, w: 11.7, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: C.textWhite
  });

  // Left Metric Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.3, w: 2.6, h: 4.1,
    rectRadius: 0.15,
    fill: { color: C.bgCardDark },
    line: { color: "1E3A5F", width: 1.5 }
  });
  slide.addText("⚡ Solar Analytics", {
    x: 1.0, y: 1.5, w: 2.2, h: 0.4,
    fontFace: FONT_TITLE, fontSize: 14, bold: true, color: C.greenSolar
  });
  slide.addText("Real-time solar energy generation vs. building power consumption curves with peak shaving alerts.", {
    x: 1.0, y: 2.0, w: 2.2, h: 3.2,
    fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1",
    lineSpacingMultiple: 1.2
  });

  // Center Synthetic Dashboard Screen Representation
  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.6, y: 1.3, w: 6.1, h: 4.1,
    rectRadius: 0.15,
    fill: { color: "07111E" },
    line: { color: C.cyan, width: 2 }
  });
  slide.addText("HITEC Unified BAS / BMS Dashboard", {
    x: 3.8, y: 1.5, w: 5.7, h: 0.4,
    fontFace: FONT_TITLE, fontSize: 15, bold: true, color: C.cyanLight
  });
  slide.addText("• Energy Overview: Generation vs Consumption\n• Live Security Camera Feeds & PTZ Patrol\n• Real-Time Access Control Badge-In Logs\n• Climate Control Zoning & Temperature\n• Network Infrastructure & AP Health Status", {
    x: 3.8, y: 2.0, w: 5.7, h: 3.2,
    fontFace: FONT_BODY, fontSize: 13, color: C.textWhite,
    lineSpacingMultiple: 1.3
  });

  // Right Metric Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 9.9, y: 1.3, w: 2.6, h: 4.1,
    rectRadius: 0.15,
    fill: { color: C.bgCardDark },
    line: { color: "1E3A5F", width: 1.5 }
  });
  slide.addText("🔒 Security & Network", {
    x: 10.1, y: 1.5, w: 2.2, h: 0.4,
    fontFace: FONT_TITLE, fontSize: 14, bold: true, color: C.cyanLight
  });
  slide.addText("Active live camera feeds, badge-ins, Wi-Fi 7 bandwidth usage, and PoE switch port health.", {
    x: 10.1, y: 2.0, w: 2.2, h: 3.2,
    fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1",
    lineSpacingMultiple: 1.2
  });

  // Bottom True Smart Building Banner
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 5.6, w: 11.7, h: 1.3,
    rectRadius: 0.1,
    fill: { color: "0B2545" },
    line: { color: "1E4976", width: 1 }
  });
  slide.addText("True Smart Building Management isn't just about collecting data — it's about cross-brand event synchronization.\nWhen a fire alarm triggers, the access gates open, the cameras pan to the zone, and the dashboard alerts your phone. Instantly.", {
    x: 1.0, y: 5.65, w: 11.3, h: 1.2,
    fontFace: FONT_BODY, fontSize: 13, bold: true, color: C.textWhite,
    align: "center", valign: "middle"
  });
}

// =========================================================================
// SLIDE 11: INDUSTRY PORTFOLIO & KEY PARTNERSHIPS (4-Quadrant Grid)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  slide.addText("INDUSTRY PORTFOLIO & KEY PARTNERSHIPS", {
    x: 0.8, y: 0.5, w: 11.7, h: 0.6,
    fontFace: FONT_TITLE, fontSize: 26, bold: true, color: C.textWhite
  });

  const quadrants = [
    {
      x: 0.8, y: 1.3, w: 5.6, h: 2.1,
      title: "Government & NGOs",
      color: C.cyanLight,
      items: ["The ASEAN Secretariat (ASEC)", "International Federation of Red Cross", "Kementerian Pendidikan & Kebudayaan", "Bawaslu"]
    },
    {
      x: 6.9, y: 1.3, w: 5.6, h: 2.1,
      title: "Commercial & Financial",
      color: "818CF8",
      items: ["Blue Bird & Blue Bird Group", "Mall Emporium Pluit", "Hotel Santika Premiere", "Clipan Finance", "Badan Kebijakan Fiskal - Kemenkeu"]
    },
    {
      x: 0.8, y: 3.6, w: 5.6, h: 2.1,
      title: "Healthcare & Education",
      color: C.greenSolar,
      items: ["RS. Columbia Asia", "Morula IVF Jakarta", "Yayasan - Universitas Kristen Indonesia"]
    },
    {
      x: 6.9, y: 3.6, w: 5.6, h: 2.1,
      title: "Industrial & Logistics",
      color: C.amber,
      items: ["PT. Hutchison Ports Indonesia", "Nippon Paint - Cargo Ships", "PT. Inti Ganda Perdana", "PT. Kahatex"]
    }
  ];

  quadrants.forEach(q => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: q.x, y: q.y, w: q.w, h: q.h,
      rectRadius: 0.1,
      fill: { color: C.bgCardDark },
      line: { color: "1E3A5F", width: 1.5 }
    });
    slide.addText(q.title, {
      x: q.x + 0.2, y: q.y + 0.15, w: q.w - 0.4, h: 0.4,
      fontFace: FONT_TITLE, fontSize: 15, bold: true, color: q.color
    });
    slide.addText(q.items.map(it => `• ${it}`).join("   |   "), {
      x: q.x + 0.2, y: q.y + 0.6, w: q.w - 0.4, h: q.h - 0.7,
      fontFace: FONT_BODY, fontSize: 12, color: C.textWhite,
      lineSpacingMultiple: 1.2
    });
  });

  // Bottom Banner
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 5.9, w: 11.7, h: 0.9,
    rectRadius: 0.1,
    fill: { color: "0B2545" },
    line: { color: C.cyan, width: 1 }
  });
  slide.addText("Securing and synchronizing the infrastructure of Indonesia's leading institutions.", {
    x: 1.0, y: 5.95, w: 11.3, h: 0.8,
    fontFace: FONT_TITLE, fontSize: 16, bold: true, color: C.textWhite,
    align: "center", valign: "middle"
  });
}

// =========================================================================
// SLIDE 12: CORPORATE LEGAL IDENTITY & CONTACT (Split Card)
// =========================================================================
{
  const slide = pres.addSlide();
  slide.background = { color: C.bgDark };

  // Left Legal Entity Box (Brand Blue)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.0, w: 5.6, h: 5.5,
    rectRadius: 0.2,
    fill: { color: "0284C7" },
    line: { color: "38BDF8", width: 2 }
  });

  // Logo
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.2, y: 1.3, w: 1.2, h: 1.2,
    rectRadius: 0.15,
    fill: { color: "0C4A6E" }
  });
  slide.addText("HITEC", {
    x: 1.2, y: 1.3, w: 1.2, h: 1.2,
    fontFace: FONT_TITLE, fontSize: 16, bold: true, color: C.textWhite,
    align: "center", valign: "middle"
  });

  slide.addText([
    { text: "Entity:\n", options: { fontSize: 13, color: "BAE6FD" } },
    { text: "PT. HITECSOLUTION TEKNOLOGI PRIMA (HITEC)\n\n", options: { fontSize: 17, bold: true, color: C.textWhite } },
    { text: "NIB:\n", options: { fontSize: 13, color: "BAE6FD" } },
    { text: "0806260054787\n\n", options: { fontSize: 16, bold: true, color: C.textWhite } },
    { text: "NPWP:\n", options: { fontSize: 13, color: "BAE6FD" } },
    { text: "10.000.000.0-987.4860\n\n", options: { fontSize: 16, bold: true, color: C.textWhite } },
    { text: "PKP:\n", options: { fontSize: 13, color: "BAE6FD" } },
    { text: "S-00133/SPPKP-CT/KPP.0605/2026", options: { fontSize: 16, bold: true, color: C.textWhite } }
  ], {
    x: 1.2, y: 2.7, w: 4.8, h: 3.5,
    fontFace: FONT_BODY
  });

  // Right Contact Grid Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 6.9, y: 1.0, w: 5.6, h: 5.5,
    rectRadius: 0.2,
    fill: { color: C.bgCardDark },
    line: { color: "1E3A5F", width: 2 }
  });

  slide.addText([
    { text: "📍 HEADQUARTERS\n", options: { bold: true, color: C.cyanLight, fontSize: 14 } },
    { text: "Jl. Kampung Irian no. 4 RT 011 RW 006, Serdang, Kemayoran, Jakarta Pusat 10650\n\n", options: { color: C.textWhite, fontSize: 15 } },
    { text: "🌐 OFFICIAL WEBSITE\n", options: { bold: true, color: C.cyanLight, fontSize: 14 } },
    { text: "http://hitec.id\n\n", options: { color: C.textWhite, fontSize: 16, bold: true } },
    { text: "✉️ EMAIL INQUIRIES\n", options: { bold: true, color: C.cyanLight, fontSize: 14 } },
    { text: "contact@hitec.id\n\n", options: { color: C.textWhite, fontSize: 16, bold: true } },
    { text: "💬 DIRECT / WHATSAPP\n", options: { bold: true, color: C.cyanLight, fontSize: 14 } },
    { text: "0851 0351 0535", options: { color: C.greenSolar, fontSize: 18, bold: true } }
  ], {
    x: 7.3, y: 1.4, w: 4.8, h: 4.8,
    fontFace: FONT_BODY, lineSpacingMultiple: 1.15
  });
}

// Write the file to disk
import fs from "fs";
const profileDir = "C:\\Antigravity IDE\\Hitec_Profile";
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}
const targetProfilePath = path.join(profileDir, "HITEC_Company_Profile_2026.pptx");
const publicPath = path.join(__dirname, "..", "..", "public", "HITEC_Company_Profile_2026.pptx");

pres.writeFile({ fileName: targetProfilePath })
  .then(() => {
    fs.copyFileSync(targetProfilePath, publicPath);
    console.log(`[SUCCESS] PowerPoint Presentation saved to: ${targetProfilePath}`);
    console.log(`[SUCCESS] Copied copy to: ${publicPath}`);
  })
  .catch((err) => {
    console.error("[ERROR] Failed to generate PPTX:", err);
    process.exit(1);
  });
