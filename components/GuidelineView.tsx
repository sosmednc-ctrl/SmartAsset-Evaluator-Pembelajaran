
import React from 'react';

interface GuidelineViewProps {
  onNavigate: (view: 'home' | 'history' | 'guideline') => void;
}

const GuidelineView: React.FC<GuidelineViewProps> = ({ onNavigate }) => {
  const colorPalette = [
    { hex: "#16AF97", name: "Tosca" }, { hex: "#007376", name: "Dark Teal" },
    { hex: "#D2DB2F", name: "Yellow" }, { hex: "#898984", name: "Grey" },
    { hex: "#BFBFBF", name: "Light Grey" }, { hex: "#63625E", name: "Dark Grey" },
    { hex: "#2B2B29", name: "Black" }, { hex: "#E4872D", name: "Orange" },
    { hex: "#43B178", name: "Green" }, { hex: "#C3B82B", name: "Olive" },
    { hex: "#06B3BC", name: "Cyan" }, { hex: "#F4F7C2", name: "Cream" },
    { hex: "#C00000", name: "Red" }, { hex: "#C7EDEC", name: "Pale Cyan" }
  ];

  const logoRequirements = [
    {
      name: "Logo Bapelkes Cikarang",
      desc: "Wajib diletakkan pada posisi utama (Sisi Kiri Atas atau Kanan Atas) sebagai identitas instansi penyelenggara pelatihan.",
    },
    {
      name: "Logo Kemenkes CorpU",
      desc: "Identitas tunggal Corporate University Kemenkes. Pastikan penulisan 'Kemenkes CorpU' benar (bukan CorU atau Corp-U).",
    },
    {
      name: "Logo BerAKHLAK",
      desc: "Logo Core Values ASN. Wajib diletakkan pada slide awal atau slide akhir sebagai bentuk internalisasi budaya kerja Kemenkes.",
    },
    {
      name: "Logo Zona Integritas",
      desc: "Logo Wilayah Bebas dari Korupsi (WBK/WBBM). Simbol komitmen instansi terhadap integritas dan kualitas pelayanan.",
    }
  ];

  const fullAspects = [
    { 
      id: "01",
      title: "Kelengkapan Logo", 
      detail: "Audit ketersediaan empat logo wajib: Bapelkes Cikarang (Instansi), Kemenkes CorpU (Brand), BerAKHLAK (Culture), dan Zona Integritas (Integrity). Pastikan logo tidak distorsi dan memiliki resolusi tinggi."
    },
    { 
      id: "02",
      title: "Standar Visual", 
      detail: "Judul materi wajib menggunakan font VAG Rounded. Konten isi menggunakan font sans-serif (Inter/Arial/Calibri) yang ergonomis. Penggunaan palet warna wajib merujuk pada Pedoman Branding Kemenkes."
    },
    { 
      id: "03",
      title: "Video Pengantar (Opening)", 
      detail: "Durasi maksimal 60 detik. Wajib memuat sapaan 'ASN Pembelajar'. Presenter menyebutkan Nama, Jabatan, dan Instansi. Menjelaskan Nama Materi, Tujuan, dan Relevansi materi terhadap tugas harian."
    },
    { 
      id: "04",
      title: "Video Penutup (Closing)", 
      detail: "Memuat ucapan terima kasih dan ajakan mempelajari materi selanjutnya. Wajib menyertakan Layar Penutup (Closing Screen) berisi: Nama Bapelkes Cikarang, Lokasi, Alamat Website, dan Akun Media Sosial resmi."
    },
    { 
      id: "05",
      title: "Tim Penyusun", 
      detail: "Adanya slide khusus yang mencantumkan peran tim: Penanggung Jawab (Kepala Balai), Ahli Materi (WI/SME), PTP (Pengembang Teknologi Pembelajaran), dan Media Specialist."
    },
    { 
      id: "06",
      title: "Petunjuk Penggunaan", 
      detail: "Instruksi navigasi yang jelas dan intuitif. Memberikan panduan bagaimana pengguna berinteraksi dengan aset (misalnya cara klik interaktivitas SCORM atau navigasi video)."
    },
    { 
      id: "07",
      title: "Hasil Belajar", 
      detail: "Mencantumkan Capaian Pembelajaran atau Hasil Belajar secara eksplisit di awal aset. Harus selaras dengan kurikulum pelatihan yang telah ditetapkan."
    },
    { 
      id: "08",
      title: "Indikator Hasil Belajar", 
      detail: "Mencantumkan indikator-indikator keberhasilan belajar yang dapat diukur (measurable) sebagai acuan pemahaman peserta."
    },
    { 
      id: "09",
      title: "Jabaran Materi", 
      detail: "Struktur penyampaian materi yang sistematis, runtut, dan memiliki alur pedagogis yang kuat (Introduction - Body - Conclusion)."
    },
    { 
      id: "10",
      title: "Materi Pokok", 
      detail: "Kedalaman substansi materi harus sesuai dengan tujuan pembelajaran. Tidak terlalu dangkal namun tidak terlalu kompleks sehingga sulit dipahami secara mandiri."
    },
    { 
      id: "11",
      title: "Refleksi Peserta", 
      detail: "Adanya slide khusus 'Sekarang Saya Tahu' (SST) atau 'Key Takeaways' sebagai bentuk penguatan dan internalisasi pesan kunci dari materi."
    },
    { 
      id: "12",
      title: "Progress Bar", 
      detail: "Khusus untuk aset interaktif (SCORM/Web-based), wajib memiliki indikator kemajuan belajar (Progress Bar) agar peserta mengetahui sisa materi yang harus dipelajari."
    },
    { 
      id: "13",
      title: "Kualitas Bahasa", 
      detail: "Kepatuhan mutlak terhadap PUEBI dan KBBI. Audit dilakukan terhadap typo (salah ketik), penggunaan huruf kapital, spasi ganda, dan konsistensi terminologi Kemenkes CorpU."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-24 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Official PTP Standards</div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">Panduan <span className="text-emerald-600">Standardisasi</span> Aset</h2>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
          Kerangka Pedoman Pengembangan Aset Pembelajaran Digital Kemenkes CorpU.
        </p>
      </div>

      {/* Required Logos Section - TEXT ONLY AS REQUESTED */}
      <section className="space-y-12">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-1.5 bg-emerald-600 rounded-full"></div>
           <h3 className="text-3xl font-black text-slate-900 tracking-tight text-center uppercase">Ketentuan Identitas Logo</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {logoRequirements.map((logo, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-start hover:border-emerald-200 transition-all group">
              <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest mb-6 group-hover:bg-emerald-600 transition-colors">
                {logo.name}
              </div>
              <p className="text-slate-500 font-bold leading-relaxed">
                {logo.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Color Palette Section */}
      <section className="bg-slate-900 rounded-[4rem] p-16 border-8 border-slate-800 shadow-3xl space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-8 gap-6">
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Warna Standar Kemenkes</h3>
            <p className="text-slate-500 text-sm font-bold mt-2">Gunakan kode hex di bawah ini untuk elemen grafis dan teks.</p>
          </div>
          <div className="px-6 py-2 bg-emerald-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest">Branding Specs</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-8">
          {colorPalette.map((color, i) => (
            <div key={i} className="group cursor-pointer flex flex-col items-center">
              <div 
                className="h-24 w-24 rounded-[2rem] shadow-2xl border-4 border-slate-800 transition-all group-hover:scale-110 group-hover:rotate-6" 
                style={{ backgroundColor: color.hex }}
              ></div>
              <div className="mt-4 text-center">
                <div className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{color.name}</div>
                <div className="text-[10px] font-bold text-emerald-500 font-mono mt-1 opacity-60">{color.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aspects Grid - REMOVED '13 ASPEK' FROM UI */}
      <section className="space-y-12">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-1.5 bg-emerald-600 rounded-full"></div>
           <h3 className="text-3xl font-black text-slate-900 tracking-tight text-center uppercase">Kriteria Evaluasi PTP</h3>
           <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Detail Standar Penilaian Komprehensif</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {fullAspects.map((aspect, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[3rem] border border-slate-100 hover:border-emerald-500 transition-all shadow-sm group flex gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-2xl group-hover:bg-emerald-600 transition-colors shadow-xl shadow-slate-200">
                    {aspect.id}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-none">{aspect.title}</h4>
                <p className="text-slate-500 text-sm font-bold leading-relaxed italic">"{aspect.detail}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Banner */}
      <div className="bg-emerald-600 rounded-[4rem] p-16 text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-3xl shadow-emerald-900/40 relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="space-y-6 text-center md:text-left max-w-2xl relative z-10">
          <h4 className="text-5xl font-black tracking-tighter leading-none">Sudah Memenuhi <span className="text-slate-900">Kriteria Standar?</span></h4>
          <p className="text-emerald-50 text-xl font-medium leading-relaxed opacity-90">
            Lakukan audit otomatis sekarang untuk memastikan aset Anda layak tayang di platform Kemenkes CorpU.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('home')} 
          className="group relative px-14 py-7 bg-slate-900 text-white font-black text-xl rounded-[2.5rem] hover:bg-white hover:text-emerald-700 transition-all shadow-2xl flex items-center gap-4 active:scale-95 z-10"
        >
          MULAI AUDIT SEKARANG
          <svg className="w-8 h-8 group-hover:translate-x-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </button>
      </div>
    </div>
  );
};

export default GuidelineView;
