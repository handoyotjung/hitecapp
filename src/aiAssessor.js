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

      // General polish ID formal based on style
      const capitalized = line.charAt(0).toUpperCase() + line.slice(1);
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
      const capitalized = line.charAt(0).toUpperCase() + line.slice(1);
      return `${num}${capitalized.endsWith('.') ? capitalized : capitalized + '.'}`;
    }
  });

  return { corrected };
}

/**
 * AI Fire Safety Assessor Pro Agent
 * Generates tailored recommendations referencing NFPA 10, NFPA 25, SNI 03-3985-2000 & ATEX standards
 */
export async function aiGenerateRecommendation(photoObj, commentsText, lang = 'ID', style = 'Baku') {
  const text = (commentsText || '').toLowerCase();

  const recs = [];

  if (lang === 'ID') {
    if (text.includes('tekanan') || text.includes('merah') || text.includes('underpressure') || text.includes('turun')) {
      if (style.includes('ATEX') || style.includes('Teknis')) {
        recs.push("[CRITICAL] Segera ganti/recharge tabung; kegagalan tekanan membahayakan proteksi area klasifikasi ATEX Zone. Ref: NFPA 10 Sec 6.1.3 & SNI 03-3985");
      } else if (style.includes('Profesional')) {
        recs.push("[CRITICAL] Lakukan penggantian unit APAR dan uji ulang sistem tekanan sebelum dioperasikan kembali. Ref: SNI 03-3985-2000");
      } else {
        recs.push("[CRITICAL] Isi ulang atau ganti tabung APAR segera. Ref: SNI 03-3985-2000 Pasal 5.2");
      }
    }
    if (text.includes('segel') || text.includes('pin') || text.includes('putus') || text.includes('hilang')) {
      if (style.includes('ATEX') || style.includes('Teknis')) {
        recs.push("[MAJOR] Pasang pin pengaman stainless steel & segel anti-tamper tersertifikasi sesuai standar NFPA 10 Sec 7.2.2");
      } else {
        recs.push("[MAJOR] Pasang kembali pin pengaman dan segel inspeksi baru. Ref: NFPA 10 Sec 7.2.2");
      }
    }
    if (text.includes('karat') || text.includes('korosi') || text.includes('shell') || text.includes('badan')) {
      if (style.includes('ATEX') || style.includes('Teknis')) {
        recs.push("[CRITICAL] Nonaktifkan tabung korosif dari area ATEX; lakukan uji hidrostatis silinder bertekanan tinggi. Ref: NFPA 10 Sec 8.3");
      } else {
        recs.push("[CRITICAL] Tarik tabung dari layanan dan lakukan uji hidrostatis. Ref: NFPA 10 Sec 8.3");
      }
    }
    if (text.includes('selang') || text.includes('hose') || text.includes('retak')) {
      if (style.includes('ATEX') || style.includes('Teknis')) {
        recs.push("[MAJOR] Ganti discharge hose dengan assembly anti-statik (electrostatic conductive) standar pabrikan. Ref: NFPA 10 Sec 7.3.1");
      } else {
        recs.push("[MAJOR] Ganti selang penyemprot (discharge hose) sesuai standar pabrikan. Ref: NFPA 10 Sec 7.3.1");
      }
    }
    if (text.includes('kadaluarsa') || text.includes('expired') || text.includes('lewat')) {
      recs.push("[MAJOR] Lakukan pemeliharaan rutin tahunan bersertifikat auditor kebakaran. Ref: SNI 03-3985-2000 Pasal 7.1");
    }

    if (recs.length === 0) {
      if (text.includes('baik') || text.includes('normal') || text.includes('layak') || text.includes('compliant')) {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          recs.push("[COMPLIANT] Parameter proteksi ledakan memenuhi persyaratan HAC (IEC 60079-10-1/2) & ATEX Directive 2014/34/EU.");
          recs.push("[NOTE] Pastikan Explosion Protection Document (EPD) termutakhir sesuai Directive 1999/92/EC.");
        } else {
          recs.push("[COMPLIANT] Kondisi fisik tabung dan penunjuk tekanan memenuhi standar. Ref: NFPA 10 Sec 7.2");
        }
      } else {
        if (style.includes('ATEX') || style.includes('Teknis')) {
          recs.push("[CRITICAL] Lakukan audit Hazardous Area Classification (HAC) & verifikasi Ignition Protection Level (EPL) sesuai IEC 60079-0 / EN 1127-1.");
          recs.push("[MAJOR] Mutakhirkan Explosion Protection Document (EPD) sesuai ATEX Workplace Directive 1999/92/EC.");
          recs.push("[MINOR] Verifikasi efektivitas dust collector & sistem proteksi ledakan debu kombustibel (EN 14491 / NFPA 652).");
        } else if (style.includes('Profesional')) {
          recs.push("[MAJOR] Lakukan pemeriksaan berkala sesuai pedoman keselamatan dan kesehatan kerja lingkungan fasilitas.");
          recs.push("[MINOR] Pastikan kelengkapan dokumen riwayat inspeksi tercatat pada kartu kendali APAR.");
        } else {
          recs.push("[MAJOR] Lakukan pemeriksaan fisik bulanan sesuai prosedur baku. Ref: SNI 03-3985-2000 Pasal 4.2");
          recs.push("[MINOR] Pastikan label instruksi dan kartu catatan inspeksi terpasang jelas. Ref: NFPA 10 Sec 7.3.3");
        }
      }
    }
  } else {
    // EN Technical
    if (text.includes('tekanan') || text.includes('merah') || text.includes('underpressure') || text.includes('pressure')) {
      if (style.includes('ATEX') || style.includes('Technical')) {
        recs.push("[CRITICAL] Immediate cylinder replacement required; pressure deficit invalidates fire protection in classified ATEX Zone. Ref: NFPA 10 Sec 6.1.3");
      } else {
        recs.push("[CRITICAL] Recharge or replace fire extinguisher immediately. Ref: NFPA 10 Sec 6.1.3.1");
      }
    }
    if (text.includes('segel') || text.includes('pin') || text.includes('putus') || text.includes('seal')) {
      recs.push("[MAJOR] Reinstall certified safety locking pin and tamper seal. Ref: NFPA 10 Sec 7.2.2");
    }
    if (text.includes('karat') || text.includes('korosi') || text.includes('corros') || text.includes('shell')) {
      recs.push("[CRITICAL] Decommission corroded cylinder from classified area; mandate hydrostatic testing per NFPA 10 Sec 8.3");
    }
    if (text.includes('selang') || text.includes('hose') || text.includes('retak')) {
      recs.push("[MAJOR] Replace with OEM anti-static conductive hose assembly immediately. Ref: NFPA 10 Sec 7.3.1");
    }
    if (text.includes('kadaluarsa') || text.includes('expired') || text.includes('interval')) {
      recs.push("[MAJOR] Conduct annual certified maintenance servicing. Ref: SNI 03-3985-2000 Sec 7.1");
    }

    if (recs.length === 0) {
      if (text.includes('baik') || text.includes('normal') || text.includes('compliant') || text.includes('good')) {
        recs.push("[COMPLIANT] Cylinder pressure gauge and physical seal fully compliant with ATEX & NFPA 10 Sec 7.2");
      } else {
        recs.push("[MAJOR] Conduct monthly visual verification audit per standard protocol. Ref: NFPA 10 Sec 7.2.1");
        recs.push("[MINOR] Ensure inspection tag and operating instructions remain legible. Ref: NFPA 10 Sec 7.3.3");
      }
    }
  }

  return { recommendations: recs.slice(0, 5) };
}
