// Official HitecApp AI Orientation & Company Profile Knowledge Base
// PT Safety Indonesia Utama - ATEX Assessment & Compliance Services

export const COMPANY_PROFILE = {
  companyName: "PT Safety Indonesia Utama",
  serviceTitle: "ATEX Assessment & Compliance Services",
  tagline: "Ensuring Safe Operations in Explosive Atmospheres",
  overview: "At PT Safety Indonesia Utama, we specialize in comprehensive ATEX assessments for industrial facilities operating in potentially explosive atmospheres. With deep expertise in ignition risk analysis, dust explosion science, and hazardous area classification, we help you achieve full compliance with ATEX Directives (2014/34/EU and 1999/92/EC), IEC standards, and global best practices.",
  directives: [
    "ATEX Equipment Directive 2014/34/EU",
    "ATEX Workplace Directive 1999/92/EC",
    "IEC 60079-10-1/2 (Hazardous Area Classification)",
    "EN 1127-1, IEC 60079-0, ISO 80079-36/37 (Ignition Risk)",
    "EN 14491, VDI 2263, NFPA 652/654/660 (Dust Explosion Risk)"
  ],
  services: [
    {
      name: "Hazardous Area Classification (HAC)",
      items: [
        "Identification of flammable gases, vapors, and combustible dusts",
        "Zoning maps (Zone 0, 1, 2 / Zone 20, 21, 22) based on IEC 60079-10-1/2",
        "Source of release analysis and ventilation effectiveness",
        "Integration with process safety and fire risk assessments"
      ]
    },
    {
      name: "Ignition Risk Assessment",
      items: [
        "Evaluation of mechanical, electrical, thermal, and electrostatic ignition sources",
        "Compliance with EN 1127-1, IEC 60079-0, and ISO 80079-36/37",
        "Streaming current estimation and electrostatic discharge risk modeling",
        "Equipment ignition protection level (EPL) verification"
      ]
    },
    {
      name: "Explosion Protection Document (EPD)",
      items: [
        "Full documentation aligned with Directive 1999/92/EC (ATEX Workplace Directive)",
        "Risk matrix development and mitigation hierarchy",
        "Operational and maintenance procedures for explosion safety",
        "Worker protection strategy and emergency planning"
      ]
    },
    {
      name: "ATEX Equipment Compliance Review",
      items: [
        "Verification of Ex-marked equipment and certification validity",
        "Suitability checks for Zone-specific deployment",
        "Gap analysis against ATEX, IECEx, and NFPA",
        "Vendor documentation review and technical file support"
      ]
    },
    {
      name: "Dust Explosion Risk Assessment",
      items: [
        "Combustible dust characterization and explosion severity estimation",
        "Assessment of dust collector systems, pneumatic conveying, and silos",
        "Compliance with EN 14491, VDI 2263, NFPA 652/654/660",
        "Fire and explosion protection system design support"
      ]
    },
    {
      name: "ATEX Training & Awareness",
      items: [
        "On-site and virtual training for operators, engineers, and safety teams",
        "Customized modules on ATEX principles, zoning, and equipment selection",
        "Practical case studies and interactive hazard identification exercises"
      ]
    },
    {
      name: "Audit Preparation & Regulatory Support",
      items: [
        "Pre-audit readiness checks and documentation alignment",
        "Support during third-party inspections and regulatory audits",
        "Closure of non-conformities and corrective action planning"
      ]
    }
  ]
};

export const getAIOrientationPrompt = () => {
  return `You are the Lead ATEX & Fire Safety AI Assessor for ${COMPANY_PROFILE.companyName} (${COMPANY_PROFILE.serviceTitle}). Your expertise covers Hazardous Area Classification (HAC) per IEC 60079-10-1/2, Ignition Risk Assessment per EN 1127-1/ISO 80079, Explosion Protection Documents (EPD) per 1999/92/EC, ATEX Equipment Compliance Review (Ex EPL), and Combustible Dust Explosion Risk Assessment (EN 14491 / NFPA 652/654/660). Provide rigorous, professional compliance observations and recommendations.`;
};
