
import React, { useState } from 'react';
import { EvaluationReport, EvaluationStatus, ChatMessage } from '../types';
import { chatAboutReport } from '../services/geminiService';

interface ReportViewProps {
  report: EvaluationReport;
  onReset: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, onReset }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASS': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'FAIL': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'WARNING': return 'bg-amber-100 text-amber-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const downloadReportTxt = () => {
    let content = `HASIL ANALISIS PROFESIONAL SMARTASET v 1.0\n`;
    content += `STANDAR PENILAIAN PTP KEMENKES CORPU\n`;
    content += `==================================================\n\n`;
    content += `NAMA ASET      : ${report.assetName}\n`;
    content += `SKOR AKHIR     : ${report.overallScore}/100\n`;
    content += `TANGGAL ANALISIS  : ${new Date(report.timestamp).toLocaleString('id-ID')}\n\n`;
    
    content += `RINGKASAN ANALISIS MENTOR AI:\n`;
    content += `---------------------------\n`;
    content += `${report.summary}\n\n`;
    
    content += `DETAIL ANALISIS VIDEO:\n`;
    content += `-------------------\n`;
    content += `- Validasi Video Opening: ${report.videoAudit.openingValid ? 'MEMENUHI SYARAT' : 'PERLU PERBAIKAN NASKAH'}\n`;
    content += `- Validasi Video Closing: ${report.videoAudit.closingValid ? 'MEMENUHI SYARAT' : 'LAYAR PENUTUP TIDAK LENGKAP'}\n`;
    content += `- Standarisasi Durasi   : ${report.videoAudit.durationOk ? 'SESUAI PEDOMAN (<60 DETIK)' : 'TERLALU LAMA (EFEKTIVITAS RENDAH)'}\n\n`;
    
    content += `TEMUAN BERDASARKAN KRITERIA PEDOMAN:\n`;
    content += `------------------------------------\n`;
    report.details.forEach((d, i) => {
      content += `${i+1}. [${d.criterion.toUpperCase()}]\n`;
      content += `   Status      : ${d.status}\n`;
      content += `   Temuan      : ${d.finding}\n`;
      content += `   Rekomendasi : ${d.recommendation}\n\n`;
    });

    if (report.typosFound.length > 0) {
      content += `DAFTAR AUDIT TATA BAHASA (KBBI/PUEBI):\n`;
      content += `--------------------------------------\n`;
      report.typosFound.forEach(t => content += `[!] ${t}\n`);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Analisis_PTP_${report.assetName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReportPdf = () => {
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    // Stylish Header
    doc.setFillColor(5, 150, 105); // Emerald 600
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Laporan Analisis Aset", 20, 32);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SmartAset v 1.0 • Standar Kemenkes CorpU Professional Analysis", 20, 42);

    y = 65;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(report.assetName, 20, y);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`ID Analisis: ${report.id} | Tanggal: ${new Date().toLocaleString('id-ID')}`, 20, y);
    
    // Score Visual
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(160, 55, 35, 35, 5, 5, 'F');
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(28);
    doc.text(`${report.overallScore}`, 177.5, 82, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("SKOR AKHIR", 177.5, 68, { align: "center" });

    y += 20;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Analisis:", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(report.summary, 170);
    doc.text(summaryLines, 20, y);
    y += (summaryLines.length * 6) + 10;

    // Detailed Analysis Section
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Analisis Komprehensif Kriteria Standar:", 20, y);
    y += 10;

    report.details.forEach((d, i) => {
      if (y > 250) { doc.addPage(); y = 25; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${i+1}. ${d.criterion} [Status: ${d.status}]`, 20, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const findingLines = doc.splitTextToSize(`Temuan Mentor: ${d.finding}`, 165);
      doc.text(findingLines, 25, y);
      y += (findingLines.length * 5) + 3;
      
      doc.setTextColor(5, 150, 105);
      doc.setFont("helvetica", "italic");
      const recLines = doc.splitTextToSize(`Usulan Perbaikan: ${d.recommendation}`, 165);
      doc.text(recLines, 25, y);
      y += (recLines.length * 5) + 8;
    });

    if (report.typosFound.length > 0) {
      if (y > 230) { doc.addPage(); y = 25; }
      y += 5;
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Audit Tata Bahasa (KBBI & PUEBI):", 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(190, 18, 60); // Rose 700
      report.typosFound.forEach(t => {
        if (y > 275) { doc.addPage(); y = 25; }
        doc.text(`[!] ${t}`, 25, y);
        y += 6;
      });
    }

    doc.save(`Laporan_Analisis_SmartAset_${report.assetName}.pdf`);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await chatAboutReport(report, chatInput, chatHistory);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Terjadi gangguan diskusi." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Hasil Analisis Aset</h2>
          </div>
          <p className="text-slate-500 font-medium ml-13">Berdasarkan Pedoman Penyusunan Aset Pembelajaran di CorpU Cikarang</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <button 
            onClick={downloadReportTxt} 
            className="flex-1 lg:flex-none px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            EKSPOR CATATAN (.TXT)
          </button>
          <button 
            onClick={downloadReportPdf} 
            className="flex-1 lg:flex-none px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            CETAK LAPORAN PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          {/* Executive Summary Card */}
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-12 space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-[10rem] -mr-32 -mt-32 opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-10 relative z-10">
              <div className="space-y-6 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-[0.2em]">Asset Metadata</div>
                <h3 className="text-3xl font-black text-slate-900 leading-tight">{report.assetName}</h3>
                <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
                   <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Ringkasan Analisis:</div>
                   <p className="text-slate-700 leading-relaxed font-medium italic">"{report.summary}"</p>
                </div>
              </div>
              <div className="text-center bg-white px-10 py-8 rounded-[2.5rem] border-4 border-emerald-50 shadow-xl min-w-[180px]">
                <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Skor PTP</div>
                <div className={`text-7xl font-black ${report.overallScore >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>{report.overallScore}</div>
                <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase">Skala 0-100</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-50 relative z-10">
               <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white transition-colors">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Validasi Multimedia</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-600">Video Opening</span>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${report.videoAudit.openingValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{report.videoAudit.openingValid ? 'VALID' : 'NON-STD'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-600">Video Closing</span>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${report.videoAudit.closingValid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{report.videoAudit.closingValid ? 'VALID' : 'NON-STD'}</span>
                    </div>
                  </div>
               </div>
               <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white transition-colors flex flex-col justify-center items-center text-center gap-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Durasi Video</div>
                  <div className={`text-sm font-black ${report.videoAudit.durationOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {report.videoAudit.durationOk ? 'SESUAI PEDOMAN' : 'MELEBIHI 60 DETIK'}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Standar Microlearning</p>
               </div>
               <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white transition-colors flex flex-col justify-center items-center text-center gap-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Temuan Linguistik</div>
                  <div className="text-3xl font-black text-slate-900">{report.typosFound.length}</div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Kesalahan KBBI/Tulisan</p>
               </div>
            </div>
          </div>

          {/* Deep Detailed Feedback */}
          <div className="space-y-8">
             <div className="flex items-center gap-4 pl-4">
                <span className="w-12 h-[2px] bg-emerald-600"></span>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Analisis Mendalam Kriteria PTP</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {report.details.map((detail, idx) => (
                  <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all border-l-8 border-l-emerald-600 flex flex-col h-full group">
                    <div className="flex justify-between items-start mb-6">
                      <h5 className="font-black text-slate-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors">{detail.criterion}</h5>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${getStatusColor(detail.status)}`}>{detail.status}</span>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Temuan Analisis:</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{detail.finding}</p>
                        </div>
                        <div className="p-6 bg-emerald-50/80 rounded-[1.5rem] border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Usulan Perbaikan:</span>
                            </div>
                            <p className="text-xs text-emerald-900 italic font-bold leading-relaxed">{detail.recommendation}</p>
                        </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* New Footer Link to Home */}
          <div className="pt-10 border-t border-slate-200 text-center">
             <button 
                onClick={onReset}
                className="inline-flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest hover:text-emerald-700 transition-colors"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Kembali ke Menu Halaman Awal untuk Analisis Dokumen Baru
             </button>
          </div>
        </div>

        {/* Auditor AI Consultation Sidebar */}
        <div className="xl:col-span-1">
           <div className="bg-slate-900 rounded-[3rem] shadow-3xl flex flex-col h-[850px] sticky top-24 overflow-hidden border-[12px] border-slate-800">
            <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 rotate-6 hover:rotate-0 transition-transform duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <div>
                <h4 className="text-white font-black text-base uppercase tracking-widest leading-none">Rekan Diskusi AI</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Sesi Aktif</span>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              <div className="bg-slate-800 p-6 rounded-[2rem] rounded-tl-none mr-10 text-slate-300 text-sm leading-relaxed border border-slate-700 shadow-lg">
                <p className="font-medium text-white">Analisis selesai.</p>
                <p className="mt-2">Apa yang ingin Anda diskusikan terkait dokumen ini?</p>
              </div>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end ml-10' : 'justify-start mr-10'}`}>
                  <div className={`p-6 rounded-[2rem] text-sm leading-relaxed whitespace-pre-wrap shadow-xl ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none font-bold' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start mr-10">
                  <div className="bg-slate-800 p-5 rounded-[2rem] rounded-tl-none text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] animate-pulse flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                    Meninjau...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChat} className="p-8 bg-slate-900 border-t border-slate-800">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pertanyaan terkait aset..."
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-8 py-6 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-inner"
                />
                <button type="submit" className="absolute right-3 top-3 p-4 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500 transition-all active:scale-90 shadow-2xl shadow-emerald-900/40 group">
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </form>
          </div>
          
          <button 
            onClick={onReset}
            className="w-full mt-8 py-5 bg-white border-4 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-lg active:scale-95"
          >
            Analisis Aset Lain
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
