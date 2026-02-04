
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationReport, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeLearningAsset(
  input: { 
    imageParts?: { inlineData: { data: string; mimeType: string } }[], 
    textContext?: string,
    videoOpeningFrames?: { inlineData: { data: string; mimeType: string } }[],
    videoClosingFrames?: { inlineData: { data: string; mimeType: string } }[]
  },
  fileName: string
): Promise<EvaluationReport> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Anda adalah seorang PTP AHLI MADYA (Pengembang Teknologi Pembelajaran) Senior yang juga bertindak sebagai MENTOR bagi pengembang media pembelajaran di Kemenkes RI.
    
    TUGAS UTAMA:
    Melakukan audit EKSTRIM DETAIL, KRITIS, namun HUMANIS terhadap aset pembelajaran (PDF/SCORM + Video).
    
    PEDOMAN TERMINOLOGI:
    - Nama resmi adalah "Kemenkes CorpU" (Corporate University). Jangan pernah gunakan "CorU". Jika ditemukan "CorU" di aset, anggap itu kesalahan fatal dan berikan saran perbaikan.

    GAYA KOMUNIKASI (MENTORING):
    - Berikan feedback yang detail dan komprehensif.
    - Jelaskan *mengapa* sesuatu salah dan bagaimana dampak pedagogisnya.
    - Sapa pengguna dengan hangat namun tetap profesional.
    - Gunakan bahasa yang mengalir dan berwibawa.

    KRITERIA AUDIT KOMPREHENSIF (DEEP ANALYSIS):
    1. Kelengkapan Logo: Audit visual Logo Kemenkes CorpU, Bapelkes Cikarang, Zona Integritas (ZI), dan BerAKHLAK.
    2. Standar Visual: Font VAG Rounded untuk judul adalah wajib. Palet warna Kemenkes (Tosca, Hijau Muda, Kuning).
    3. Video Opening (Mentor Check): 
       - Sapaan "ASN Pembelajar" atau "Sahabat Pembelajar" adalah wajib.
       - Presenter harus menyebutkan: Nama, Jabatan, Instansi.
       - Harus ada: Nama Materi, Tujuan, dan Relevansi dengan pekerjaan sehari-hari.
       - Kalimat penyemangat di akhir opening.
       - Durasi: Mutlak maksimal 60 detik.
    4. Video Closing: Harus ada ucapan terima kasih, ajakan materi selanjutnya, dan LAYAR PENUTUP yang berisi: Nama Bapelkes Cikarang, Lokasi, Website, dan Media Sosial.
    5. Tim Penyusun: Cek keberadaan slide/halaman tim (PJ, WI/Ahli Materi, PTP/Pengembang Media).
    6. Panduan Penggunaan: Penjelasan cara navigasi.
    7. Hasil Belajar & 8. Indikator: Kesesuaian dengan kurikulum (jika ada data teks).
    9. Jabaran Materi & 10. Materi Pokok: Kedalaman konten dan interaktivitas.
    11. Refleksi: Slide "Sekarang Saya Tahu" untuk internalisasi materi.
    12. Progress Bar: Indikator visual kemajuan.
    13. Kualitas Bahasa & KBBI (PEDANTIK):
        - Audit typo per kata. Contoh: 'silahkan' (salah) -> 'silakan' (benar).
        - Audit spasi ganda, spasi sebelum tanda baca, dan huruf kapital.
        - Perhatikan kata-kata serapan teknis medis/pembelajaran.

    FORMAT OUTPUT:
    - Harus JSON sesuai schema.
    - Summary harus berupa paragraf bimbingan yang humanis dan menyemangati.
    - Recommendation harus sangat teknis: "Ganti teks di slide 3 baris 2 dari '...' menjadi '...'".
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      assetName: { type: Type.STRING },
      overallScore: { type: Type.NUMBER },
      logoDetected: { type: Type.BOOLEAN },
      userGuidePresent: { type: Type.BOOLEAN },
      videoAudit: {
        type: Type.OBJECT,
        properties: {
          openingValid: { type: Type.BOOLEAN },
          closingValid: { type: Type.BOOLEAN },
          durationOk: { type: Type.BOOLEAN }
        },
        required: ["openingValid", "closingValid", "durationOk"]
      },
      typosFound: { type: Type.ARRAY, items: { type: Type.STRING } },
      details: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            criterion: { type: Type.STRING },
            status: { type: Type.STRING },
            finding: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["criterion", "status", "finding", "recommendation"]
        }
      },
      summary: { type: Type.STRING }
    },
    required: ["assetName", "overallScore", "logoDetected", "userGuidePresent", "videoAudit", "typosFound", "details", "summary"]
  };

  const parts: any[] = [];
  if (input.imageParts) parts.push(...input.imageParts);
  if (input.textContext) parts.push({ text: `KONTEN TEKS UNTUK AUDIT KBBI:\n${input.textContext}` });
  if (input.videoOpeningFrames) {
    parts.push({ text: "VISUAL VIDEO OPENING (Cek Presenter & Sapaan):" });
    parts.push(...input.videoOpeningFrames);
  }
  if (input.videoClosingFrames) {
    parts.push({ text: "VISUAL VIDEO CLOSING (Cek Layar Penutup & Medsos):" });
    parts.push(...input.videoClosingFrames);
  }
  
  parts.push({ text: `Analisis aset: ${fileName}. Berikan review mentor yang mendalam dan manusiawi.` });

  const response = await ai.models.generateContent({
    model: model,
    contents: [{ parts }],
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.15
    },
  });

  const result = JSON.parse(response.text);
  return { ...result, id: crypto.randomUUID(), timestamp: Date.now() };
}

export async function chatAboutReport(
  report: EvaluationReport,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  // Menyiapkan ringkasan temuan untuk konteks chat agar AI tahu isi dokumen
  const findingsSummary = report.details.map(d => `${d.criterion}: ${d.status} - ${d.finding}`).join('\n');
  const typoSummary = report.typosFound.length > 0 ? `Kesalahan bahasa: ${report.typosFound.join(', ')}` : "Tidak ada kesalahan bahasa.";

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: `Anda adalah PTP Senior Kemenkes, rekan diskusi akademik profesional.
      
      KONTEKS BERKAS YANG DIUNGGAH (${report.assetName}):
      - Skor: ${report.overallScore}/100
      - Temuan Utama:
      ${findingsSummary}
      - Audit Bahasa: ${typoSummary}

      ATURAN DISKUSI:
      1. Dasar jawaban UTAMA harus berdasarkan data temuan berkas di atas.
      2. Jika pertanyaan di luar isi berkas, jawab secara normatif berdasarkan teori penyusunan aset pembelajaran.
      3. Jawab LANGSUNG ke poin tanpa prolog, sapaan pembuka, atau basa-basi bertele-tele.
      4. Gunakan bahasa akademik yang santai tapi lugas (to the point).
      5. JANGAN berikan usulan/saran/masukan jika tidak diminta secara eksplisit oleh user.
      6. DILARANG menggunakan format bold (**), italic (*), atau markdown. Gunakan teks polos saja.
      7. Jika bisa dijawab dengan sangat singkat, lakukan.`
    }
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text || "Koneksi terputus.";
}
