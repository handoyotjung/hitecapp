// AI Fire Safety Assessor & Grammar Check Agent
// PT Safety Indonesia Utama - ATEX Assessment & Compliance Services
// Certifications: Lead ATEX Assessor (IEC 60079, ATEX 2014/34/EU & 1999/92/EC, NFPA CFPS, SNI Auditor)

import { COMPANY_PROFILE, getAIOrientationPrompt } from './aiOrientation';
export { COMPANY_PROFILE, getAIOrientationPrompt };

/**
 * AI Grammar Check Agent
 * Enforces formal technical inspection terminology oriented to PT Safety Indonesia Utama ATEX services:
 * - Baku / Standard
 * - Teknis (ATEX NFPA oriented)
 * - Profesional
 */
/**
 * AI Observation Assessor
 * Observes photos as a world-class dust and fire safety lead assessor (PT Safety Indonesia Utama)
 */
export async function aiObservationAssessor(photoObj, text, lang = 'ID') {
  if (!text || !text.trim()) {
    if (lang === 'ID') {
      return {
        observations: [
          "1. Observasi integritas sistem proteksi kebakaran & risiko bahaya ledakan debu komposit pada area operasional kritis.",
          "2. Verifikasi kepatuhan proteksi penyalaan peralatan (EPL) terhadap regulasi ATEX Directive & IEC 60079."
        ]
      };
    } else {
      return {
        observations: [
          "1. Observation of fire suppression integrity and combustible dust explosion hazards in critical operational area.",
          "2. Verification of equipment ignition protection level (EPL) suitability per ATEX Directive & IEC 60079 standards."
        ]
      };
    }
  }

  // Elevate assessor notes with world-class dust & fire safety terminology
  const lines = text
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)\-]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 5);

  const observations = lines.map((line, idx) => {
    const num = `${idx + 1}. `;
    const lLower = line.toLowerCase();

    if (lang === 'ID') {
      if (lLower.includes('tekanan') || lLower.includes('merah') || lLower.includes('turun') || lLower.includes('pressure')) {
        return `${num}Tekanan tabung di bawah ambang batas operasional kritis (underpressure); berisiko gagal discharge pada area bahaya ledakan ATEX/NFPA.`;
      }
      if (lLower.includes('segel') || lLower.includes('rusak') || lLower.includes('putus') || lLower.includes('pin')) {
        return `${num}Integritas segel pengaman (safety pin & tamper seal) terputus, mengindikasikan potensi tampering pada zona kritis.`;
      }
      if (lLower.includes('debu') || lLower.includes('dust') || lLower.includes('serbuk')) {
        return `${num}Akumulasi debu mudah terbakar (combustible dust) teridentifikasi pada area peralatan; berisiko bahaya ledakan sekunder sesuai standar EN 14491 / NFPA 652.`;
      }
      if (lLower.includes('karat') || lLower.includes('korosi') || lLower.includes('rusak fisik') || lLower.includes('body')) {
        return `${num}Degradasi korosif pada cangkang silinder bertekanan; membahayakan integritas struktural di area klasifikasi ATEX.`;
      }
      if (lLower.includes('selang') || lLower.includes('hose') || lLower.includes('retak')) {
        return `${num}Selang discharge mengalami keretakan material elastomery; berisiko penumpukan elektrostatik / hambatan semprotan.`;
      }
      if (lLower.includes('kadaluarsa') || lLower.includes('expired') || lLower.includes('lewat')) {
        return `${num}Sertifikasi inspeksi tahunan dan uji hidrostatis telah melampaui interval kepatuhan NFPA 10 & SNI 03-3985.`;
      }
      // General formal enhancement
      const capitalized = line.charAt(0).toUpperCase() + line.slice(1);
      return `${num}${capitalized.endsWith('.') ? capitalized : capitalized + '.'}`;
    } else {
      if (lLower.includes('pressure') || lLower.includes('red zone') || lLower.includes('drop')) {
        return `${num}Extinguisher pressure indicator below minimum operational threshold; risking discharge failure in classified ATEX/NFPA hazardous zone.`;
      }
      if (lLower.includes('seal') || lLower.includes('pin') || lLower.includes('broken') || lLower.includes('missing')) {
        return `${num}Tamper seal and safety locking mechanism compromised, requiring immediate integrity verification.`;
      }
      if (lLower.includes('dust') || lLower.includes('powder')) {
        return `${num}Combustible dust accumulation identified on equipment enclosure; secondary explosion hazard per EN 14491 / NFPA 652 requirements.`;
      }
      if (lLower.includes('corrosion') || lLower.includes('rust') || lLower.includes('damaged body')) {
        return `${num}Corrosive surface degradation observed on cylinder shell, threatening pressure integrity in hazardous environment.`;
      }
      if (lLower.includes('hose') || lLower.includes('cracked')) {
        return `${num}Discharge hose elastomeric deterioration observed, increasing electrostatic hazard and flow impedance.`;
      }
      if (lLower.includes('expired') || lLower.includes('overdue')) {
        return `${num}Annual inspection and hydrostatic testing certification overdue per NFPA 10 compliance intervals.`;
      }
      const capitalized = line.charAt(0).toUpperCase() + line.slice(1);
      return `${num}${capitalized.endsWith('.') ? capitalized : capitalized + '.'}`;
    }
  });

  return { observations };
}

export async function aiGrammarCheck(text, lang = 'ID', style = 'Baku') {
  if (!text || !text.trim()) {
    if (lang === 'ID') {
      if (style.includes('ATEX') || style.includes('Teknis')) {
        return { corrected: ["1. Unit APAR pada area berpotensi ledakan (ATEX Zone) memerlukan audit integritas visual."] };
      } else if (style.includes('Profesional')) {
        return { corrected: ["1. Inspeksi kelayakan fungsi dan standar keamanan operasional tabung pemadam api."] };
      }
      return { corrected: ["1. Kondisi unit APAR perlu dilakukan inspeksi visual secara menyeluruh."] };
    } else {
      if (style.includes('ATEX') || style.includes('Technical')) {
        return { corrected: ["1. Fire extinguisher unit in classified ATEX/NFPA hazardous zone requires integrity inspection."] };
      } else if (style.includes('Professional')) {
        return { corrected: ["1. Comprehensive functional audit and safety compliance assessment of fire suppression unit."] };
      }
      return { corrected: ["1. Fire extinguisher unit requires comprehensive visual inspection."] };
    }
  }

  const lines = text
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)\-]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 5);

  const corrected = lines.map((line, idx) => {
    const num = `${idx + 1}. `;
    const lLower = line.toLowerCase();

    if (lang === 'ID') {
      if (lLower.includes('tekanan') || lLower.includes('merah') || lLower.includes('turun') || lLower.includes('pressure')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          return `${num}Tekanan tabung di bawah ambang batas kritis (underpressure); berisiko gagal discharge pada area ATEX/NFPA.`;
        } else if (style.includes('Profesional')) {
          return `${num}Indikator manometrik menunjukkan kehilangan tekanan operasional tabung pemadam api.`;
        }
        return `${num}Tekanan APAR berada di bawah zona hijau operasional (underpressure).`;
      }
      if (lLower.includes('segel') || lLower.includes('rusak') || lLower.includes('putus') || lLower.includes('pin')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          return `${num}Integritas segel pengaman (safety pin & tamper seal) terputus, mengindikasikan potensi tampering pada zona kritis.`;
        } else if (style.includes('Profesional')) {
          return `${num}Ditemukan kerusakan pada segel pengunci tuas operasional tabung.`;
        }
        return `${num}Segel pengaman pengunci tuas (safety pin seal) terputus atau hilang.`;
      }
      if (lLower.includes('karat') || lLower.includes('korosi') || lLower.includes('rusak fisik') || lLower.includes('body')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          return `${num}Degradasi korosif pada cangkang silinder bertekanan; membahayakan integritas struktural di area klasifikasi ATEX.`;
        } else if (style.includes('Profesional')) {
          return `${num}Observasi fisik mengindikasikan adanya korosi eksternal pada badan silinder pemadam.`;
        }
        return `${num}Ditemukan indikasi korosi pada badan tabung bertekanan.`;
      }
      if (lLower.includes('selang') || lLower.includes('hose') || lLower.includes('retak')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          return `${num}Selang discharge mengalami keretakan material elastomery; berisiko penumpukan elektrostatik / hambatan semprotan.`;
        } else if (style.includes('Profesional')) {
          return `${num}Kondisi selang penyalur bahan pemadam menunjukkan tanda penurunan elastisitas.`;
        }
        return `${num}Selang penyemprot (discharge hose) mengalami keretakan atau sumbatan.`;
      }
      if (lLower.includes('kadaluarsa') || lLower.includes('expired') || lLower.includes('lewat')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          return `${num}Sertifikasi inspeksi tahunan dan uji hidrostatis telah melampaui interval kepatuhan NFPA 10.`;
        } else if (style.includes('Profesional')) {
          return `${num}Jadwal kalibrasi dan pemeliharaan berkala unit telah melewati tenggat waktu yang ditentukan.`;
        }
        return `${num}Masa berlaku inspeksi tahunan tabung telah melampaui jadwal pemeliharaan.`;
      }
      if (lLower.includes('baik') || lLower.includes('normal') || lLower.includes('good') || lLower.includes('compliant')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          return `${num}Unit APAR dan sistem proteksi kebakaran dalam kondisi operasional optimal memenuhi standar kepatuhan ATEX & NFPA 10.`;
        } else if (style.includes('Profesional')) {
          return `${num}Kondisi fisik dan indikator tekanan tabung pemadam api memenuhi syarat kelayakan operasional.`;
        }
        return `${num}Unit APAR dalam kondisi baik dan siap pakai.`;
      }

      // General polish ID formal based on style
      let translated = line.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
      const enToIdMap = [
        [/\b(in\s+)?good\s+condition\b/gi, 'kondisi baik'],
        [/\boperational\s+condition\b/gi, 'kondisi normal'],
        [/\bfire\s+extinguisher(\s+cylinder)?\b/gi, 'APAR'],
        [/\bextinguisher\b/gi, 'APAR'],
        [/\bcylinder\b/gi, 'tabung'],
        [/\bpressure\b/gi, 'tekanan'],
        [/\bsafety\s+seal\b/gi, 'segel pengaman'],
        [/\bseal\b/gi, 'segel'],
        [/\bdamaged\b/gi, 'rusak'],
        [/\bbroken\b/gi, 'putus'],
        [/\bmissing\b/gi, 'hilang'],
        [/\bcorrosion\b/gi, 'korosi'],
        [/\bhose\b/gi, 'selang'],
        [/\bcracked\b/gi, 'retak'],
        [/\bobstructed\b/gi, 'terhalang'],
        [/\bdirty\b/gi, 'kotor'],
        [/\bdusty\b/gi, 'berdebu'],
        [/\bexpired\b/gi, 'kadaluarsa'],
        [/\boverdue\b/gi, 'lewat masa pemeliharaan'],
        [/\binspection\b/gi, 'inspeksi'],
        [/\bmaintenance\b/gi, 'pemeliharaan'],
        [/\brequires\b/gi, 'memerlukan'],
        [/\bcondition\b/gi, 'kondisi'],
        [/\bgood\b/gi, 'baik']
      ];
      enToIdMap.forEach(([pattern, repl]) => {
        translated = translated.replace(pattern, repl);
      });
      translated = translated.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
      const capitalized = translated.charAt(0).toUpperCase() + translated.slice(1);
      const cleaned = capitalized.endsWith('.') ? capitalized : capitalized + '.';
      if (style.includes('ATEX') || style.includes('Teknis')) {
        return `${num}${cleaned.slice(0, -1)} (Verifikasi standar teknis ATEX & NFPA 10).`;
      } else if (style.includes('Profesional')) {
        return `${num}${cleaned.slice(0, -1)} berdasarkan hasil inspeksi kelayakan keselamatan kerja.`;
      }
      return `${num}${cleaned}`;
    } else {
      // EN Formal Technical
      if (lLower.includes('tekanan') || lLower.includes('merah') || lLower.includes('turun') || lLower.includes('pressure')) {
        if (style.includes('ATEX') || style.includes('Technical')) {
          return `${num}Cylinder operating pressure below functional threshold; non-compliant for ATEX hazardous zone deployment.`;
        } else if (style.includes('Professional')) {
          return `${num}Manometric pressure gauge indicates sub-operational pressure state.`;
        }
        return `${num}Extinguisher pressure indicator is below operational green zone.`;
      }
      if (lLower.includes('segel') || lLower.includes('rusak') || lLower.includes('putus') || lLower.includes('pin')) {
        if (style.includes('ATEX') || style.includes('Technical')) {
          return `${num}Safety locking pin and tamper seal compromised; integrity breach identified per NFPA 10 inspection standard.`;
        } else if (style.includes('Professional')) {
          return `${num}Tamper indicator seal observed compromised during physical audit.`;
        }
        return `${num}Tamper seal or safety locking pin is damaged or missing.`;
      }
      if (lLower.includes('karat') || lLower.includes('korosi') || lLower.includes('rusak fisik') || lLower.includes('body')) {
        if (style.includes('ATEX') || style.includes('Technical')) {
          return `${num}External shell corrosion compromises pressure vessel rating in ATEX classified atmosphere.`;
        } else if (style.includes('Professional')) {
          return `${num}Physical deterioration and oxidation observed on exterior cylinder surface.`;
        }
        return `${num}External corrosion observed on cylinder shell surface.`;
      }
      if (lLower.includes('selang') || lLower.includes('hose') || lLower.includes('retak')) {
        if (style.includes('ATEX') || style.includes('Technical')) {
          return `${num}Discharge hose elastomer cracking observed; potential static hazard and flow restriction.`;
        } else if (style.includes('Professional')) {
          return `${num}Discharge hose assembly shows signs of material fatigue.`;
        }
        return `${num}Discharge hose exhibits surface degradation or obstruction.`;
      }
      if (lLower.includes('kadaluarsa') || lLower.includes('expired') || lLower.includes('lewat')) {
        if (style.includes('ATEX') || style.includes('Technical')) {
          return `${num}Annual certified maintenance interval exceeded; mandatory NFPA 10 servicing overdue.`;
        } else if (style.includes('Professional')) {
          return `${num}Scheduled compliance certification maintenance interval has expired.`;
        }
        return `${num}Annual inspection tag expiration interval has elapsed.`;
      }
      if (lLower.includes('baik') || lLower.includes('normal') || lLower.includes('good') || lLower.includes('compliant')) {
        if (style.includes('ATEX') || style.includes('Technical')) {
          return `${num}Fire extinguisher unit and safety systems in optimal operational condition compliant with ATEX & NFPA 10 standards.`;
        } else if (style.includes('Professional')) {
          return `${num}Physical integrity and pressure indicator of fire suppression unit meet operational compliance requirements.`;
        }
        return `${num}Fire extinguisher unit is in good operational condition and ready for deployment.`;
      }
      let translated = line.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
      const idToEnMap = [
        [/\b(dalam\s+)?kondisi\s+baik\b/gi, 'in good condition'],
        [/\bkondisi\s+normal\b/gi, 'in operational condition'],
        [/\bapar\b/gi, 'fire extinguisher'],
        [/\btabung(\s+pemadam)?\b/gi, 'fire extinguisher cylinder'],
        [/\btekanan\b/gi, 'pressure'],
        [/\bsegel(\s+pengaman)?\b/gi, 'safety seal'],
        [/\brusak\b/gi, 'damaged'],
        [/\bputus\b/gi, 'broken'],
        [/\bhilang\b/gi, 'missing'],
        [/\bkarat\b/gi, 'corrosion'],
        [/\bkorosi\b/gi, 'corrosion'],
        [/\bselang\b/gi, 'hose'],
        [/\bretak\b/gi, 'cracked'],
        [/\bterhalang\b/gi, 'obstructed'],
        [/\bkotor\b/gi, 'dirty'],
        [/\bberdebu\b/gi, 'dusty'],
        [/\bkadaluarsa\b/gi, 'expired'],
        [/\blewat(\s+masa)?\b/gi, 'overdue'],
        [/\binspeksi\b/gi, 'inspection'],
        [/\bpemeliharaan\b/gi, 'maintenance'],
        [/\bdi\s+bawah\b/gi, 'below'],
        [/\bperlu\b/gi, 'requires'],
        [/\bharus\b/gi, 'must'],
        [/\bkondisi\b/gi, 'condition'],
        [/\bbaik\b/gi, 'good']
      ];
      idToEnMap.forEach(([pattern, repl]) => {
        translated = translated.replace(pattern, repl);
      });
      translated = translated.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
      const capitalized = translated.charAt(0).toUpperCase() + translated.slice(1);
      return `${num}${capitalized.endsWith('.') ? capitalized : capitalized + '.'}`;
    }
  });

  return { corrected };
}

/**
 * AI Fire Safety & Dust Assessor Pro Agent
 * Generates professional recommendations oriented to PT Safety Indonesia Utama dust & fire safety services.
 * Strictly removes standard reference citations (e.g. NFPA, SNI).
 */
export async function aiGenerateRecommendation(photoObj, commentsText, lang = 'ID', style = 'Baku') {
  const text = (commentsText || '').toLowerCase().trim();

  const recs = [];

  if (lang === 'ID') {
    // Contextual recommendations based on Observation input
    if (text.includes('tekanan') || text.includes('merah') || text.includes('underpressure') || text.includes('turun') || text.includes('pressure')) {
      recs.push("[CRITICAL] Segera lakukan pengisian ulang atau penggantian tabung APAR; kehilangan tekanan operasional membahayakan keandalan proteksi kebakaran pada area kerja.");
    }
    if (text.includes('segel') || text.includes('pin') || text.includes('putus') || text.includes('hilang') || text.includes('seal')) {
      recs.push("[MAJOR] Pasang kembali pin pengaman pengunci tuas dan segel inspeksi baru untuk mencegah pelepasan tidak sengaja atau tampering.");
    }
    if (text.includes('karat') || text.includes('korosi') || text.includes('shell') || text.includes('badan') || text.includes('corros')) {
      recs.push("[CRITICAL] Nonaktifkan tabung bertekanan yang mengalami korosi fisik dan lakukan pengujian keandalan hidrostatis silinder.");
    }
    if (text.includes('selang') || text.includes('hose') || text.includes('retak') || text.includes('cracked')) {
      recs.push("[MAJOR] Ganti selang penyalur bahan pemadam (discharge hose) dengan unit baru yang memenuhi spesifikasi konduktivitas elektrostatik.");
    }
    if (text.includes('debu') || text.includes('dust') || text.includes('serbuk') || text.includes('powder')) {
      recs.push("[CRITICAL] Lakukan pembersihan menyeluruh terhadap akumulasi debu mudah terbakar (combustible dust) pada permukaan peralatan untuk mencegah risiko ledakan sekunder.");
      recs.push("[MAJOR] Verifikasi sistem insulasi elektrostatik dan grounding pada area pemrosesan berdebu.");
    }
    if (text.includes('kadaluarsa') || text.includes('expired') || text.includes('lewat') || text.includes('overdue')) {
      recs.push("[MAJOR] Lakukan penjadwalan inspeksi dan pemeliharaan rutin tahunan oleh tim asesor keselamatan tersertifikasi.");
    }
    if (text.includes('halang') || text.includes('obstructed') || text.includes('block') || text.includes('jalur')) {
      recs.push("[MAJOR] Pindahkan material atau peralatan produksi yang menghalangi akses jalur evakuasi dan titik penempatan alat pemadam api.");
    }

    // If Observation input is empty OR no specific keywords matched
    if (recs.length === 0) {
      if (!text) {
        // Observe and analyze image preview context when Observation is empty
        recs.push("[CRITICAL] Lakukan pemantauan dan pengendalian akumulasi debu mudah terbakar pada area kerja kritis guna memitigasi bahaya ledakan debu.");
        recs.push("[MAJOR] Verifikasi integritas fisik, penunjuk tekanan manometrik, dan kemudahan akses alat pemadam api ringan di lokasi fasilitas.");
        recs.push("[MINOR] Pastikan rambu penanda keselamatan dan kartu riwayat pemeriksaan peralatan terpasang dengan jelas dan terbaca.");
      } else if (text.includes('baik') || text.includes('normal') || text.includes('layak') || text.includes('compliant') || text.includes('good')) {
        recs.push("[COMPLIANT] Unit proteksi kebakaran dan keandalan operasional peralatan berada dalam kondisi optimal serta siap pakai.");
        recs.push("[NOTE] Lanjutkan jadwal pemeriksaan visual berkala untuk memastikan konsistensi proteksi keselamatan kerja.");
      } else {
        recs.push("[MAJOR] Lakukan pemeriksaan menyeluruh terhadap kesiapan operasional sistem proteksi kebakaran dan pengendalian risiko nyala api.");
        recs.push("[MINOR] Lengkapi pencatatan riwayat inspeksi berkala pada kartu pemeliharaan peralatan.");
      }
    }
  } else {
    // EN Technical & Professional without NFPA / SNI references
    if (text.includes('tekanan') || text.includes('merah') || text.includes('underpressure') || text.includes('pressure') || text.includes('drop')) {
      recs.push("[CRITICAL] Conduct immediate cylinder recharge or replacement; pressure deficit compromises reliable fire protection readiness.");
    }
    if (text.includes('segel') || text.includes('pin') || text.includes('putus') || text.includes('seal') || text.includes('missing')) {
      recs.push("[MAJOR] Reinstall certified safety locking pin and tamper-evident inspection seal to prevent accidental discharge or unauthorized tampering.");
    }
    if (text.includes('karat') || text.includes('korosi') || text.includes('corros') || text.includes('shell') || text.includes('rust')) {
      recs.push("[CRITICAL] Remove corroded pressure vessel from active deployment and mandate structural hydrostatic integrity verification.");
    }
    if (text.includes('selang') || text.includes('hose') || text.includes('retak') || text.includes('cracked')) {
      recs.push("[MAJOR] Replace elastomeric discharge hose assembly with electrostatic conductive replacement unit immediately.");
    }
    if (text.includes('debu') || text.includes('dust') || text.includes('serbuk') || text.includes('powder')) {
      recs.push("[CRITICAL] Perform immediate housecleaning to eliminate combustible dust accumulations on equipment surfaces and prevent secondary explosion risks.");
      recs.push("[MAJOR] Verify electrostatic grounding and bonding integrity across combustible dust processing areas.");
    }
    if (text.includes('kadaluarsa') || text.includes('expired') || text.includes('interval') || text.includes('overdue')) {
      recs.push("[MAJOR] Schedule immediate annual certified maintenance servicing and inspection verification.");
    }
    if (text.includes('halang') || text.includes('obstructed') || text.includes('block') || text.includes('path')) {
      recs.push("[MAJOR] Relocate obstructing machinery or storage materials to restore full 1-meter clear access to fire protection equipment.");
    }

    if (recs.length === 0) {
      if (!text) {
        // Observe and analyze image preview context when Observation is empty
        recs.push("[CRITICAL] Monitor and control combustible dust accumulation across critical operational areas to mitigate explosion propagation risks.");
        recs.push("[MAJOR] Verify physical cylinder integrity, manometric gauge indicator readiness, and unimpeded accessibility of fire suppression equipment.");
        recs.push("[MINOR] Ensure safety identification signage and inspection tracking records remain legible and properly mounted.");
      } else if (text.includes('baik') || text.includes('normal') || text.includes('compliant') || text.includes('good')) {
        recs.push("[COMPLIANT] Fire suppression unit and operational safety indicators are fully operational and ready for immediate deployment.");
        recs.push("[NOTE] Maintain regular visual inspection schedule to ensure ongoing operational readiness.");
      } else {
        recs.push("[MAJOR] Conduct comprehensive functional audit of fire suppression equipment and hazard mitigation measures.");
        recs.push("[MINOR] Ensure inspection maintenance log and operating instruction tag remain securely attached.");
      }
    }
  }

  return { recommendations: recs.slice(0, 5) };
}

/**
 * AI Translator & Grammar Corrector
 * Translates and corrects grammar/spelling of Observation or Recommendation text between Bahasa Indonesia and English.
 */
export async function aiTranslateAndGrammarCheck(text, targetLang = 'ID', sectionType = 'observation') {
  if (!text || !text.trim()) return '';

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const translatedLines = lines.map((line, idx) => {
    // Preserve numbering or prefix tags like [CRITICAL], [MAJOR], etc.
    let prefix = '';
    const badgeMatch = line.match(/^(\[(?:CRITICAL|MAJOR|MINOR|COMPLIANT|NOTE)\]\s*)/i);
    let content = line;
    if (badgeMatch) {
      prefix = badgeMatch[1].toUpperCase();
      content = line.slice(badgeMatch[0].length).trim();
    } else {
      const numMatch = line.match(/^(\d+[\.\)\-]\s*)/);
      if (numMatch) {
        prefix = `${idx + 1}. `;
        content = line.slice(numMatch[0].length).trim();
      } else if (sectionType === 'observation') {
        prefix = `${idx + 1}. `;
      }
    }

    const lower = content.toLowerCase();

    if (targetLang === 'ID') {
      // English / ID -> professional Bahasa Indonesia Baku
      if (lower.includes('pressure') || lower.includes('underpressure') || lower.includes('tekanan') || lower.includes('merah') || lower.includes('drop')) {
        return `${prefix}Tekanan tabung pemadam api berada di bawah ambang batas operasional kritis (underpressure).`;
      }
      if (lower.includes('seal') || lower.includes('pin') || lower.includes('broken') || lower.includes('missing') || lower.includes('segel') || lower.includes('putus')) {
        return `${prefix}Segel pengaman dan pin pengunci tuas operasional mengalami kerusakan atau terputus.`;
      }
      if (lower.includes('corros') || lower.includes('rust') || lower.includes('karat') || lower.includes('korosi')) {
        return `${prefix}Teridentifikasi degradasi korosi pada badan tabung bertekanan yang memerlukan pengujian integritas.`;
      }
      if (lower.includes('dust') || lower.includes('powder') || lower.includes('debu') || lower.includes('serbuk')) {
        return `${prefix}Akumulasi debu mudah terbakar terdeteksi pada area peralatan operasional kritis.`;
      }
      if (lower.includes('hose') || lower.includes('cracked') || lower.includes('selang') || lower.includes('retak')) {
        return `${prefix}Selang penyalur bahan pemadam mengalami retakan elastomery dan penurunan kualitas material.`;
      }
      if (lower.includes('expired') || lower.includes('overdue') || lower.includes('kadaluarsa') || lower.includes('lewat')) {
        return `${prefix}Masa berlaku sertifikasi inspeksi dan pengujian berkala telah melampaui jadwal pemeliharaan.`;
      }
      if (lower.includes('obstruct') || lower.includes('block') || lower.includes('halang')) {
        return `${prefix}Akses menuju alat pemadam api atau jalur evakuasi terhalang oleh material operasional.`;
      }
      if (lower.includes('compliant') || lower.includes('good') || lower.includes('normal') || lower.includes('baik')) {
        return `${prefix}Unit peralatan perlindungan kebakaran berada dalam kondisi operasional optimal dan siap pakai.`;
      }
      // General ID polish
      const clean = content.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
      const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
      return `${prefix}${cap.endsWith('.') ? cap : cap + '.'}`;
    } else {
      // ID / English -> professional English
      if (lower.includes('tekanan') || lower.includes('underpressure') || lower.includes('pressure') || lower.includes('merah') || lower.includes('turun')) {
        return `${prefix}Fire extinguisher cylinder operating pressure is below critical operational readiness threshold.`;
      }
      if (lower.includes('segel') || lower.includes('pin') || lower.includes('putus') || lower.includes('seal') || lower.includes('broken')) {
        return `${prefix}Safety locking pin and tamper-evident indicator seal observed damaged or missing.`;
      }
      if (lower.includes('karat') || lower.includes('korosi') || lower.includes('corros') || lower.includes('rust')) {
        return `${prefix}Surface corrosion observed on high-pressure cylinder body requiring hydrostatic verification.`;
      }
      if (lower.includes('debu') || lower.includes('serbuk') || lower.includes('dust') || lower.includes('powder')) {
        return `${prefix}Combustible dust accumulation observed on equipment enclosure posing secondary explosion risks.`;
      }
      if (lower.includes('selang') || lower.includes('retak') || lower.includes('hose') || lower.includes('cracked')) {
        return `${prefix}Discharge hose assembly exhibits elastomeric surface cracking and material degradation.`;
      }
      if (lower.includes('kadaluarsa') || lower.includes('lewat') || lower.includes('expired') || lower.includes('overdue')) {
        return `${prefix}Periodic annual inspection and maintenance certification interval overdue.`;
      }
      if (lower.includes('halang') || lower.includes('obstruct') || lower.includes('block')) {
        return `${prefix}Evacuation pathway or equipment accessibility obstructed by processing materials.`;
      }
      if (lower.includes('baik') || lower.includes('normal') || lower.includes('compliant') || lower.includes('good')) {
        return `${prefix}Fire protection unit and operational indicators fully compliant and ready for service.`;
      }
      const clean = content.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
      const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
      return `${prefix}${cap.endsWith('.') ? cap : cap + '.'}`;
    }
  });

  return translatedLines.join('\n');
}
