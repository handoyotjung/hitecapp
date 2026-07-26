// Safety Demo Project Initializer & Data Seed
// Dedicated isolated seed generator for Safety client demo project (safety.hitec.id / hitecapp-safety)

export const SAFETY_DEMO_PROJECT_SEED = {
  id: "proj_safety_demo_001",
  name: "ATEX Inspection Demo - Safety ID Plant 1",
  company_id: "co_safety_id",
  company_name: "PT Safety Indonesia Utama",
  city_name: "Cilegon",
  created_at: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  created_by: "demo@hitec.id",
  userId: "user_safety_demo",
  retention_days: 7,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  photos: [
    {
      id: "photo_safety_01",
      filename: "Ex_d_Flameproof_Enclosure_Zone1.jpg",
      originalFilename: "Ex_d_Flameproof_Enclosure_Zone1.jpg",
      url: "/logo-hs-original.png",
      thumbnailUrl: "/logo-icon.png",
      caption: "Ex d Flameproof Enclosure Gap Inspection - Zone 1 Flammable Gas Area",
      comments_text: "Flameproof joint gap verified within IEC 60079-1 maximum permitted clearance (0.15mm). No corrosion or pitting observed on flame path surface.",
      comments: "Flameproof joint gap verified within IEC 60079-1 maximum permitted clearance (0.15mm). No corrosion or pitting observed on flame path surface.",
      comments_lang: "EN",
      grade: "F1",
      assessment_grade: "F1",
      status: "done",
      latest_status: "Open",
      date: new Date().toISOString().split('T')[0],
      location: "Ex-Zone 1 Compressor Room",
      recommendations_json: [
        "Maintain annual torque check on enclosure bolts according to EN 1127-1 Annex A.",
        "Ensure anti-corrosion grease applied to flame path complies with ISO 80079-36 thermal stability standards."
      ],
      recommendations_lang: "EN",
      size_kb: 450,
      created_at: new Date().toISOString()
    },
    {
      id: "photo_safety_02",
      filename: "Dust_Collector_Pneumatic_Silo_Zone20.jpg",
      originalFilename: "Dust_Collector_Pneumatic_Silo_Zone20.jpg",
      url: "/logo-hs-original.png",
      thumbnailUrl: "/logo-icon.png",
      caption: "Combustible Dust Collector System - Zone 20 Explosive Dust Atmosphere",
      comments_text: "Pneumatic dust collector vessel assessed for dust explosion severity (Kst class ST-2). Explosion venting panel and isolation valve verified compliant with EN 14491 & NFPA 652.",
      comments: "Pneumatic dust collector vessel assessed for dust explosion severity (Kst class ST-2). Explosion venting panel and isolation valve verified compliant with EN 14491 & NFPA 652.",
      comments_lang: "EN",
      grade: "F2",
      assessment_grade: "F2",
      status: "done",
      latest_status: "Open",
      date: new Date().toISOString().split('T')[0],
      location: "Dust Silo Processing Unit",
      recommendations_json: [
        "Verify bonding and grounding continuity on flexible duct connections (resistance < 10 ohms).",
        "Inspect explosion vent burst disk membrane for dust accumulation every 30 days per VDI 2263."
      ],
      recommendations_lang: "EN",
      size_kb: 520,
      created_at: new Date().toISOString()
    }
  ]
};
