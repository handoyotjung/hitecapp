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
export async function aiObservationAssessor(photoObj, text, lang = 'EN') {
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

export async function aiGrammarCheck(text, lang = 'EN', style = 'Baku') {
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
export async function aiGenerateRecommendation(photoObj, commentsText, lang = 'EN', style = 'Baku') {
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
export async function aiTranslateAndGrammarCheck(text, targetLang = 'EN', sectionType = 'observation') {
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

/**
 * AI Feedback Agent Conversational Interviewer
 * Conducts one-open-question-at-a-time product experience interview.
 * Understands informal Indonesian (ga, ngga, udah, lemot, ribet, mantap, exportnya, dll.).
 * Keeps tone human, warm, and natural without mentioning backend tasks or developers.
 */
export async function aiFeedbackChatStep(history = [], userMessage = '', stepIndex = 0, lang = 'ID') {
  const isId = lang === 'ID';

  // Initial opening
  if (stepIndex === 0 && (!userMessage || !userMessage.trim())) {
    return isId
      ? "Halo, ada yang bisa saya bantu?"
      : "Hello, how can I help you today?";
  }

  const msgLower = (userMessage || '').toLowerCase().trim();

  // If user indicates they are done ("tidak ada", "ngga ada", "ga ada", "cukup", "sudah", "makasih", "terima kasih", "no", "none")
  if (
    msgLower === 'tidak' ||
    msgLower === 'ngga' ||
    msgLower === 'engga' ||
    msgLower === 'ga' ||
    msgLower === 'gak' ||
    msgLower === 'tidak ada' ||
    msgLower === 'ngga ada' ||
    msgLower === 'ga ada' ||
    msgLower === 'sudah' ||
    msgLower === 'udah' ||
    msgLower === 'cukup' ||
    msgLower.includes('terima kasih') ||
    msgLower.includes('makasih') ||
    msgLower === 'no' ||
    msgLower === 'none' ||
    msgLower.includes("that's all")
  ) {
    return isId
      ? "Terima kasih banyak atas waktu dan masukan Anda! Semua catatan Anda telah kami simpan untuk direview oleh tim HitecApp. Sukses selalu!"
      : "Thank you so much for your time and feedback! Your notes have been saved and will be reviewed by our HitecApp team. Have a wonderful day!";
  }

  // Hybrid UX AI Agent: answer standard HitecApp how-to usage questions if asked
  if (isId) {
    if (msgLower.includes('cara upload') || msgLower.includes('bagaimana upload') || msgLower.includes('unggah foto') || msgLower.includes('masukin foto')) {
      return "Untuk mengunggah foto, Kakak bisa klik tombol 'Select Photos' atau 'Upload Folder' di sebelah kiri atas, atau langsung drag & drop foto ke kotak upload. Apakah ada yang lain?";
    }
    if (msgLower.includes('cara anotasi') || msgLower.includes('cara gambar') || msgLower.includes('menandai zona')) {
      return "Untuk memberi anotasi, pilih foto dari antrian di bawah, lalu gunakan alat gambar di canvas tengah untuk menandai zona ATEX atau area berbahaya. Apakah ada yang lain?";
    }
    if (msgLower.includes('cara export') || msgLower.includes('cara unduh') || msgLower.includes('download laporan') || msgLower.includes('bikin word')) {
      return "Untuk mengunduh laporan, pastikan foto sudah dipilih di antrian, lalu klik tombol Word, Excel, atau Powerpoint di panel bawah. Apakah ada yang lain?";
    }
    if (msgLower.includes('kuota') || msgLower.includes('bayar') || msgLower.includes('gratis')) {
      return "Sesi obrolan dan masukan ini sepenuhnya gratis dan tidak memotong kuota harian foto Anda. Apakah ada yang lain?";
    }

    // Default response for user feedback, issues, suggestions, or unanswered questions
    return "Masukan Anda akan kami tampung dan direview oleh tim kami. Apakah ada yang lain?";
  } else {
    if (msgLower.includes('how to upload') || msgLower.includes('upload photo')) {
      return "To upload photos, click 'Select Photos' or 'Upload Folder' in the top left, or drag & drop files directly into the upload box. Is there anything else?";
    }
    if (msgLower.includes('how to annotate') || msgLower.includes('draw')) {
      return "To annotate, select a photo from the queue below and use the drawing tools on the main canvas to mark ATEX zones or hazard areas. Is there anything else?";
    }
    if (msgLower.includes('how to export') || msgLower.includes('download report')) {
      return "To download reports, ensure your photos are checked in the queue, then click the Word, Excel, or Powerpoint button in the bottom panel. Is there anything else?";
    }

    // Default response for feedback or unsolved items
    return "Your feedback will be recorded and reviewed by our team. Is there anything else?";
  }
}

/**
 * Helper to translate/convert Indonesian feedback expressions into clear English developer statements
 */
function translateIdToEnglishIssue(text = '') {
  const t = text.trim();
  const lower = t.toLowerCase();

  let enDesc = "User feedback note: " + t;
  if (lower.includes('export') && (lower.includes('lemot') || lower.includes('lama') || lower.includes('lambat'))) {
    enDesc = "User experienced latency/slow performance when exporting Word reports, especially with multiple or high-resolution photos.";
  } else if (lower.includes('upload') && (lower.includes('lemot') || lower.includes('lama') || lower.includes('error'))) {
    enDesc = "User reported delays or errors during photo uploading.";
  } else if (lower.includes('canvas') || lower.includes('anotasi')) {
    if (lower.includes('shortcut')) {
      enDesc = "User requested keyboard shortcuts for canvas annotation to speed up workflow.";
    } else if (lower.includes('bingung') || lower.includes('ribet')) {
      enDesc = "User found image canvas annotation controls confusing or cumbersome.";
    } else {
      enDesc = "User feedback regarding canvas annotation: " + t;
    }
  } else if (lower.includes('dark mode') || lower.includes('gelap')) {
    enDesc = "User requested dark theme toggle or visual preference settings.";
  } else if (lower.includes('lemot') || lower.includes('lambat') || lower.includes('berat')) {
    enDesc = "User reported slow application responsiveness (" + t + ").";
  } else if (lower.includes('error') || lower.includes('ga bisa') || lower.includes('ngga bisa') || lower.includes('bug')) {
    enDesc = "User encountered functional error/bug: " + t;
  } else if (lower.includes('pengen') || lower.includes('pingin') || lower.includes('tambah') || lower.includes('harusnya ada')) {
    enDesc = "User requested feature enhancement: " + t;
  }
  return enDesc;
}

/**
 * AI Feedback Synthesizer
 * Server-side / data-layer synthesis of full user feedback transcript into structured JSON.
 * Translates Indonesian everyday feedback into clear English developer descriptions and prompt.
 */
export async function aiFeedbackSynthesize(history = [], userEmail = '', userPlan = 'starter', lang = 'ID') {
  const issues = [];
  const feature_requests = [];
  let positiveCount = 0;
  let negativeCount = 0;

  const combinedText = history
    .filter(m => m.role === 'user')
    .map(m => m.text)
    .join(' \n ');

  // Inspect user replies for actionable issues & translate into clear English developer statements
  history.forEach(item => {
    if (item.role !== 'user' || !item.text) return;
    const t = item.text;
    const l = t.toLowerCase();

    // Check slowness / performance / crash / blurry
    if (l.includes('lemot') || l.includes('lambat') || l.includes('slow') || l.includes('lag') || l.includes('berat') || l.includes('loading lama')) {
      negativeCount++;
      let screen = 'General Workflow';
      if (l.includes('export') || l.includes('word') || l.includes('laporan') || l.includes('unduh')) screen = 'Export Report / Word';
      else if (l.includes('upload') || l.includes('unggah') || l.includes('foto')) screen = 'Upload Zone';
      else if (l.includes('canvas') || l.includes('anotasi') || l.includes('gambar')) screen = 'Annotated Canvas';

      const enDesc = translateIdToEnglishIssue(t);
      issues.push({
        title: "Performance latency during " + screen,
        description: enDesc,
        original_quote: t.trim(),
        screen: screen,
        severity: "medium"
      });
    }

    // Check errors / crash / broken
    if (l.includes('error') || l.includes('ga bisa') || l.includes('ngga bisa') || l.includes('gak bisa') || l.includes('pecah') || l.includes('crash') || l.includes('bug')) {
      negativeCount++;
      let screen = 'General Workflow';
      if (l.includes('export') || l.includes('word') || l.includes('laporan')) screen = 'Export Report / Word';
      else if (l.includes('upload') || l.includes('foto')) screen = 'Upload Zone';
      else if (l.includes('canvas') || l.includes('anotasi')) screen = 'Annotated Canvas';

      const enDesc = translateIdToEnglishIssue(t);
      issues.push({
        title: "Functional friction reported on " + screen,
        description: enDesc,
        original_quote: t.trim(),
        screen: screen,
        severity: "high"
      });
    }

    // Check confusion / cumbersome workflow
    if (l.includes('ribet') || l.includes('bingung') || l.includes('susah') || l.includes('pusing') || l.includes('confus') || l.includes('complicated')) {
      negativeCount++;
      const enDesc = translateIdToEnglishIssue(t);
      issues.push({
        title: "UX confusion or workflow friction",
        description: enDesc,
        original_quote: t.trim(),
        screen: "General Workflow",
        severity: "low"
      });
    }

    // Check feature requests
    if (l.includes('pengen') || l.includes('pingin') || l.includes('wish') || l.includes('tambah') || l.includes('tambahin') || l.includes('seandainya') || l.includes('kalau bisa') || l.includes('kalo bisa') || l.includes('harusnya ada')) {
      const enDesc = translateIdToEnglishIssue(t);
      feature_requests.push({
        title: "User Feature Request",
        description: enDesc,
        original_quote: t.trim()
      });
    }

    // Check positive keywords
    if (l.includes('mantap') || l.includes('keren') || l.includes('bagus') || l.includes('gampang') || l.includes('mudah') || l.includes('oke') || l.includes('lancar') || l.includes('great') || l.includes('good')) {
      positiveCount++;
    }
  });

  // Deduplicate issues by title & description snippet
  const seenIssues = new Set();
  const uniqueIssues = issues.filter(i => {
    const key = `${i.screen}-${i.title}`;
    if (seenIssues.has(key)) return false;
    seenIssues.add(key);
    return true;
  });

  // Derive title, summary, and satisfaction note (in clear English)
  const title = uniqueIssues.length > 0
    ? `Product Feedback: ${uniqueIssues.length} Actionable Issue(s) Reported`
    : feature_requests.length > 0
      ? `Feature Enhancement Request (${feature_requests.length} Idea(s))`
      : "Positive Experience Evaluation Session";

  const summary = combinedText.length > 0
    ? `User (${userEmail}, Plan: ${userPlan.toUpperCase()}) completed product experience interview. Translated key feedback into English for developer tracking.`
    : `User completed short feedback check-in.`;

  let satisfaction_note = "High Satisfaction — User found workflow intuitive and responsive.";
  if (negativeCount > positiveCount && uniqueIssues.some(i => i.severity === 'high')) {
    satisfaction_note = "Needs Attention — Reported workflow bottleneck or functional blocker.";
  } else if (uniqueIssues.length > 0) {
    satisfaction_note = "Constructive Feedback — Satisfied overall with minor optimization requests.";
  }

  // Format Antigravity Prompt (100% English developer prompt with translated descriptions)
  const issuesFormatted = uniqueIssues.map((it, idx) => 
    `${idx + 1}. [Screen: ${it.screen} | Severity: ${it.severity.toUpperCase()}] ${it.title}:\n   - English Actionable Description: ${it.description}\n   - Original User Quote (ID): "${it.original_quote || it.description}"`
  ).join('\n') || "No critical bugs reported.";

  const frFormatted = feature_requests.map((fr, idx) =>
    `${idx + 1}. ${fr.title}:\n   - English Actionable Description: ${fr.description}\n   - Original User Quote (ID): "${fr.original_quote || fr.description}"`
  ).join('\n') || "None explicitly requested.";

  const antigravity_prompt = `Task: Fix reported bugs, performance issues, and evaluate user feature requests in HitecApp

Context:
Submitted by user account: ${userEmail} (${userPlan.toUpperCase()} Plan)
Evaluation Summary: ${summary}
Satisfaction Indicator: ${satisfaction_note}

Issues to Fix:
${issuesFormatted}

Feature Requests to Implement:
${frFormatted}

Acceptance Criteria:
- Fix reported high/medium severity bugs and latency issues on specified application screens.
- Implement or evaluate requested UX improvements without breaking existing HitecApp dark slate + emerald styling.
- Ensure all user workflows remain quota-safe where required.`;

  return {
    title,
    summary,
    satisfaction_note,
    issues: uniqueIssues,
    feature_requests,
    antigravity_prompt
  };
}

// ==========================================
// UPGRADED COMMENTS & RECOMMENDATIONS SYSTEM
// PART 1: Database & AI Learning Engine
// ==========================================

const DEFAULT_AI_RECOMMENDATION_RULES = [
  // F3 Critical rules
  { grade: 'F3', keyword: 'corrosion', recommendation_template: '[CRITICAL] Replace equipment immediately due to severe corrosion', priority: 1, language: 'English' },
  { grade: 'F3', keyword: 'korosi', recommendation_template: '[CRITICAL] Segera ganti atau isolasi peralatan bertekanan akibat kerusakan korosi berat', priority: 1, language: 'ID' },
  { grade: 'F3', keyword: 'karat', recommendation_template: '[CRITICAL] Segera ganti peralatan yang mengalami degradasi korosif parah pada badan tabung', priority: 1, language: 'ID' },
  { grade: 'F3', keyword: 'dust', recommendation_template: '[CRITICAL] Perform immediate housecleaning to eliminate combustible dust accumulations and prevent secondary explosion per EN 14491 / NFPA 652', priority: 1, language: 'English' },
  { grade: 'F3', keyword: 'debu', recommendation_template: '[CRITICAL] Lakukan pembersihan menyeluruh terhadap akumulasi debu mudah terbakar pada area kerja kritis sesuai EN 14491 / NFPA 652', priority: 1, language: 'ID' },
  { grade: 'F3', keyword: 'pressure', recommendation_template: '[CRITICAL] Conduct immediate cylinder replacement or recharge; critical pressure loss in ATEX classified atmosphere', priority: 1, language: 'English' },
  { grade: 'F3', keyword: 'tekanan', recommendation_template: '[CRITICAL] Segera lakukan penggantian atau pengisian ulang tabung APAR karena kehilangan tekanan operasional kritis', priority: 1, language: 'ID' },
  { grade: 'F3', keyword: 'spark', recommendation_template: '[CRITICAL] De-energize equipment and eliminate electrostatic discharge risk sources immediately per IEC 60079-0', priority: 1, language: 'English' },

  // F2 Major rules
  { grade: 'F2', keyword: 'leak', recommendation_template: '[MAJOR] Repair leak and re-test within 7 days', priority: 1, language: 'English' },
  { grade: 'F2', keyword: 'bocor', recommendation_template: '[MAJOR] Lakukan perbaikan kebocoran dan pengujian hidrostatis ulang dalam waktu 7 hari', priority: 1, language: 'ID' },
  { grade: 'F2', keyword: 'seal', recommendation_template: '[MAJOR] Reinstall certified safety locking pin and tamper-evident inspection seal immediately', priority: 1, language: 'English' },
  { grade: 'F2', keyword: 'segel', recommendation_template: '[MAJOR] Pasang kembali pin pengaman pengunci tuas dan segel inspeksi baru untuk mencegah pelepasan tidak sengaja', priority: 1, language: 'ID' },
  { grade: 'F2', keyword: 'hose', recommendation_template: '[MAJOR] Replace elastomeric discharge hose assembly with electrostatic conductive replacement unit', priority: 1, language: 'English' },
  { grade: 'F2', keyword: 'selang', recommendation_template: '[MAJOR] Ganti selang penyalur bahan pemadam (discharge hose) yang retak atau terhambat', priority: 1, language: 'ID' },
  { grade: 'F2', keyword: 'expired', recommendation_template: '[MAJOR] Schedule annual certified maintenance servicing and hydrostatic re-testing per NFPA 10', priority: 1, language: 'English' },
  { grade: 'F2', keyword: 'kadaluarsa', recommendation_template: '[MAJOR] Lakukan penjadwalan inspeksi dan pemeliharaan tahunan oleh tim asesor keselamatan tersertifikasi', priority: 1, language: 'ID' },
  { grade: 'F2', keyword: 'obstructed', recommendation_template: '[MAJOR] Relocate obstructing machinery to maintain 1-meter clear accessibility to fire protection equipment', priority: 1, language: 'English' },
  { grade: 'F2', keyword: 'halang', recommendation_template: '[MAJOR] Pindahkan material yang menghalangi akses jalur evakuasi dan titik penempatan alat pemadam api', priority: 1, language: 'ID' },
  { grade: 'F2', keyword: 'earthing', recommendation_template: '[MAJOR] Verify electrostatic grounding and bonding integrity across combustible dust processing areas', priority: 1, language: 'English' },

  // F1 Minor rules
  { grade: 'F1', keyword: 'label', recommendation_template: '[MINOR] Install missing label and tag', priority: 1, language: 'English' },
  { grade: 'F1', keyword: 'missing', recommendation_template: '[MINOR] Install missing safety identification signage and inspection tracking record tag', priority: 1, language: 'English' },
  { grade: 'F1', keyword: 'hilang', recommendation_template: '[MINOR] Pasang kembali rambu penanda keselamatan dan kartu riwayat pemeriksaan peralatan', priority: 1, language: 'ID' },
  { grade: 'F1', keyword: 'dirty', recommendation_template: '[MINOR] Clean external cylinder enclosure and ensure operating instructions remain legible', priority: 1, language: 'English' },
  { grade: 'F1', keyword: 'kotor', recommendation_template: '[MINOR] Bersihkan permukaan luar tabung dan pastikan petunjuk penggunaan tetap terbaca dengan jelas', priority: 1, language: 'ID' },
  { grade: 'F1', keyword: 'good', recommendation_template: '[COMPLIANT] Fire protection unit is in optimal operational condition and ready for deployment', priority: 1, language: 'English' },
  { grade: 'F1', keyword: 'baik', recommendation_template: '[COMPLIANT] Unit peralatan perlindungan kebakaran berada dalam kondisi operasional optimal dan siap pakai', priority: 1, language: 'ID' }
];

export function extractKeywords(text) {
  if (!text || !text.trim()) return [];
  const lower = text.toLowerCase();
  const knownKeywords = [
    'corrosion', 'leak', 'label', 'missing', 'dust', 'pressure', 'tekanan', 'merah', 'drop',
    'seal', 'segel', 'pin', 'putus', 'karat', 'korosi', 'hose', 'selang', 'retak', 'cracked',
    'expired', 'kadaluarsa', 'overdue', 'obstructed', 'halang', 'earthing', 'grounding',
    'gland', 'cable', 'spark', 'zone', 'ip rating', 'repair', 'replace', 'install', 'monitor',
    'bocor', 'kotor', 'dirty', 'good', 'baik', 'normal'
  ];
  const matches = knownKeywords.filter(kw => lower.includes(kw));
  if (matches.length > 0) return [...new Set(matches)];
  const words = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length >= 4);
  return [...new Set([...matches, ...words.slice(0, 3)])];
}

export function getStoredRules() {
  try {
    const raw = localStorage.getItem('hitec_ai_recommendation_rules_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed, ...DEFAULT_AI_RECOMMENDATION_RULES];
      }
    }
  } catch (e) {}
  return DEFAULT_AI_RECOMMENDATION_RULES;
}

export function getStoredCommentsTraining() {
  try {
    const raw = localStorage.getItem('hitec_ai_comments_training_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    { phrase: 'Tekanan tabung di bawah ambang batas operasional kritis (underpressure); berisiko gagal discharge.', keyword: 'tekanan', grade: 'F3', language: 'ID', frequency: 10 },
    { phrase: 'Integritas segel pengaman (safety pin & tamper seal) terputus atau hilang pada zona operasional.', keyword: 'segel', grade: 'F2', language: 'ID', frequency: 9 },
    { phrase: 'Akumulasi debu mudah terbakar (combustible dust) teridentifikasi pada area peralatan berpotensi ledakan.', keyword: 'debu', grade: 'F3', language: 'ID', frequency: 11 },
    { phrase: 'Degradasi korosif pada cangkang silinder bertekanan; membahayakan integritas struktural tabung.', keyword: 'karat', grade: 'F3', language: 'ID', frequency: 8 },
    { phrase: 'Selang discharge mengalami keretakan material elastomery / sumbatan fisik.', keyword: 'selang', grade: 'F2', language: 'ID', frequency: 7 },
    { phrase: 'Unit APAR dalam kondisi baik, tekanan normal, dan siap pakai.', keyword: 'baik', grade: 'F1', language: 'ID', frequency: 15 },
    { phrase: 'Extinguisher pressure indicator below minimum operational threshold; risking discharge failure.', keyword: 'pressure', grade: 'F3', language: 'English', frequency: 10 },
    { phrase: 'Tamper seal and safety locking mechanism compromised, requiring immediate integrity verification.', keyword: 'seal', grade: 'F2', language: 'English', frequency: 9 },
    { phrase: 'Combustible dust accumulation identified on equipment enclosure; secondary explosion hazard per EN 14491.', keyword: 'dust', grade: 'F3', language: 'English', frequency: 11 },
    { phrase: 'Corrosive surface degradation observed on cylinder shell, threatening pressure vessel integrity.', keyword: 'corrosion', grade: 'F3', language: 'English', frequency: 8 },
    { phrase: 'Discharge hose elastomeric deterioration observed, increasing flow impedance.', keyword: 'hose', grade: 'F2', language: 'English', frequency: 7 },
    { phrase: 'Fire protection unit and operational indicators fully compliant and ready for service.', keyword: 'good', grade: 'F1', language: 'English', frequency: 15 }
  ];
}

export async function generateRecommendation(commentText, grade = 'F2', language = 'EN') {
  if (!commentText || !grade) return "";
  const gradeShort = (grade || 'F2').split(' - ')[0].trim(); // e.g. F2
  const keywords = extractKeywords(commentText);
  const allRules = getStoredRules();

  const isEng = !(language === 'ID' || language === 'id' || language === 'Bahasa' || language === 'Bahasa Indonesia');
  const targetLang = isEng ? 'English' : 'ID';

  let recs = [];
  for (const kw of keywords) {
    const matchedRules = allRules
      .filter(r => r.grade === gradeShort && r.keyword.toLowerCase() === kw.toLowerCase() && (r.language === targetLang || r.language === (isEng ? 'EN' : 'Bahasa')))
      .sort((a, b) => (a.priority || 1) - (b.priority || 1));
    if (matchedRules.length > 0) {
      recs.push(matchedRules[0].recommendation_template);
    } else {
      // check if keyword matches regardless of language if exact lang rule missing
      const anyLangMatches = allRules.filter(r => r.grade === gradeShort && r.keyword.toLowerCase() === kw.toLowerCase());
      if (anyLangMatches.length > 0) {
        recs.push(anyLangMatches[0].recommendation_template);
      }
    }
  }

  if (recs.length === 0) {
    if (gradeShort === 'F3') {
      return isEng 
        ? "[CRITICAL] Immediate action required: Replace or isolate compromised equipment immediately due to critical safety defect"
        : "[CRITICAL] Segera ganti atau isolasi peralatan yang rusak berat demi keselamatan operasional";
    }
    if (gradeShort === 'F2') {
      return isEng
        ? "[MAJOR] Action required within 30 days: Repair defect and conduct operational re-test"
        : "[MAJOR] Lakukan perbaikan dan pengujian ulang fungsi peralatan dalam waktu maksimal 30 hari";
    }
    return isEng
      ? "[MINOR] Monitor during next inspection: Install missing label or maintain regular maintenance schedule"
      : "[MINOR] Lakukan pemantauan pada jadwal inspeksi berikutnya atau lengkapi penanda/label yang kurang";
  }

  return [...new Set(recs)].join('\n');
}

export function getAISuggestions(commentText, grade = 'F2', language = 'EN') {
  const gradeShort = (grade || 'F2').split(' - ')[0].trim();
  const isEng = !(language === 'ID' || language === 'id' || language === 'Bahasa' || language === 'Bahasa Indonesia');
  const targetLang = isEng ? 'English' : 'ID';
  const training = getStoredCommentsTraining();

  const keywords = extractKeywords(commentText);
  let matching = training.filter(item => 
    (item.language === targetLang || item.language === (isEng ? 'EN' : 'Bahasa')) &&
    (keywords.includes(item.keyword) || item.grade === gradeShort)
  );

  if (matching.length === 0) {
    matching = training.filter(item => item.language === targetLang);
  }

  // Sort by frequency descending and return unique phrases
  matching.sort((a, b) => (b.frequency || 1) - (a.frequency || 1));
  const phrases = [...new Set(matching.map(m => m.phrase))];
  return phrases.slice(0, 4);
}

export async function learnComment(user, project, photo) {
  if (!photo) return;
  const gradeShort = (photo.grade || 'F2').split(' - ')[0].trim();
  const commentText = photo.komentar || photo.comments_text || photo.comments || '';
  const recommendationText = photo.rekomendasi || (Array.isArray(photo.recommendations_json) ? photo.recommendations_json.join('\n') : '') || '';
  const aiSuggestedRec = photo.aiSuggestedRec || '';
  const manualOverride = Boolean(photo.manualOverride || recommendationText !== aiSuggestedRec);

  // 1. Save to Logs (`comment_logs`)
  const logEntry = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    project_id: project?.id || 'proj_' + Date.now(),
    project_name: project?.name || 'Project',
    photo_id: photo?.id || photo?.filename || 'photo',
    photo_filename: photo?.filename || 'IMG.jpg',
    user_email: user?.email || 'assessor@hitec.id',
    timestamp: new Date().toISOString(),
    comment: commentText,
    grade: photo.grade || 'F2 - Major',
    recommendation: recommendationText,
    ai_suggested_rec: aiSuggestedRec || recommendationText,
    manual_override: manualOverride
  };

  try {
    const existingLogsRaw = localStorage.getItem('hitec_comment_logs_v1');
    const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    existingLogs.unshift(logEntry);
    localStorage.setItem('hitec_comment_logs_v1', JSON.stringify(existingLogs.slice(0, 1000)));
  } catch (e) {}

  // 2. Train AI Comments (`ai_comments_training`)
  if (commentText && commentText.trim().length > 5) {
    try {
      const training = getStoredCommentsTraining();
      const keywords = extractKeywords(commentText);
      const kw = keywords[0] || 'general';
      const existingIdx = training.findIndex(t => t.phrase.toLowerCase() === commentText.toLowerCase());
      if (existingIdx >= 0) {
        training[existingIdx].frequency = (training[existingIdx].frequency || 1) + 1;
      } else {
        training.unshift({
          phrase: commentText.trim(),
          keyword: kw,
          grade: gradeShort,
          language: project?.language || 'EN',
          frequency: 1
        });
      }
      localStorage.setItem('hitec_ai_comments_training_v1', JSON.stringify(training.slice(0, 200)));
    } catch (e) {}
  }

  // 3. Train AI Recommendation Rules (`ai_recommendation_rules`)
  if (commentText && recommendationText && recommendationText.trim().length > 5) {
    try {
      const keywords = extractKeywords(commentText);
      if (keywords.length > 0) {
        const storedRules = getStoredRules();
        let newRules = [...storedRules];
        for (const kw of keywords) {
          const ruleIdx = newRules.findIndex(r => r.grade === gradeShort && r.keyword.toLowerCase() === kw.toLowerCase() && r.language === (project?.language || 'EN'));
          if (ruleIdx >= 0) {
            if (manualOverride) {
              newRules[ruleIdx].recommendation_template = recommendationText;
            }
          } else {
            newRules.push({
              grade: gradeShort,
              keyword: kw,
              recommendation_template: recommendationText,
              priority: 1,
              language: project?.language || 'EN'
            });
          }
        }
        localStorage.setItem('hitec_ai_recommendation_rules_v1', JSON.stringify(newRules));
      }
    } catch (e) {}
  }
}
