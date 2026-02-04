
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ReportView from './components/ReportView';
import GuidelineView from './components/GuidelineView';
import { AppState, EvaluationReport } from './types';
import { analyzeLearningAsset } from './services/geminiService';

// @ts-ignore
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
// @ts-ignore
const JSZip = window.JSZip;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'home',
    files: { pdf: null, scorm: null, videoOpening: null, videoClosing: null },
    isAnalyzing: false,
    report: null,
    history: [],
    error: null,
    progress: 0,
    chatHistory: [],
    isChatting: false
  });

  const [activeSource, setActiveSource] = useState<'pdf' | 'scorm' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('smartaset_history');
    if (saved) {
      try { setState(prev => ({ ...prev, history: JSON.parse(saved) })); } 
      catch (e) { console.error("History parse failed"); }
    }
  }, []);

  const saveToHistory = (report: EvaluationReport) => {
    const updatedHistory = [report, ...state.history].slice(0, 10);
    setState(prev => ({ ...prev, history: updatedHistory }));
    localStorage.setItem('smartaset_history', JSON.stringify(updatedHistory));
  };

  const extractFramesFromVideo = async (file: File): Promise<{ inlineData: { data: string, mimeType: string } }[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      
      video.onloadedmetadata = () => {
        const frames: { inlineData: { data: string, mimeType: string } }[] = [];
        const captureTimes = [0.5, video.duration / 2, video.duration - 0.5];
        let captured = 0;

        const capture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          frames.push({ inlineData: { data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], mimeType: 'image/jpeg' } });
          captured++;
          
          if (captured < captureTimes.length) {
            video.currentTime = captureTimes[captured];
          } else {
            resolve(frames);
          }
        };

        video.onseeked = capture;
        video.currentTime = captureTimes[0];
      };
    });
  };

  const handleFileUpload = (type: 'pdf' | 'scorm', file: File | null) => {
    if (!file) {
      setActiveSource(null);
      setState(prev => ({ ...prev, files: { ...prev.files, [type]: null }, error: null }));
      return;
    }

    setActiveSource(type);
    setState(prev => ({
      ...prev,
      files: {
        ...prev.files,
        pdf: type === 'pdf' ? file : null,
        scorm: type === 'scorm' ? file : null
      },
      error: null
    }));
  };

  const startAnalysis = async () => {
    if (!state.files.pdf && !state.files.scorm) {
      setState(prev => ({ ...prev, error: "Pilih salah satu sumber utama: PDF atau SCORM." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, progress: 5 }));

    try {
      let imageParts = [];
      let textContext = "";
      let videoOpeningFrames = [];
      let videoClosingFrames = [];

      // Deep Extract PDF
      if (state.files.pdf) {
        const arrayBuffer = await state.files.pdf.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pagesToScan = Math.min(pdf.numPages, 12); // Scan more pages for better detail
        for (let i = 1; i <= pagesToScan; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          imageParts.push({ inlineData: { data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], mimeType: 'image/jpeg' } });
          
          const text = await page.getTextContent();
          textContext += `[Halaman ${i}]\n${text.items.map((item: any) => item.str).join(' ')}\n\n`;
          setState(prev => ({ ...prev, progress: 5 + Math.round((i / pagesToScan) * 45) }));
        }
      }

      // Deep Extract SCORM
      if (state.files.scorm) {
        const zip = await JSZip.loadAsync(state.files.scorm);
        textContext = "STRUKTUR PAKET SCORM:\n";
        const manifest = await zip.file("imsmanifest.xml")?.async("string");
        if (manifest) textContext += `MANIFEST XML:\n${manifest}\n`;
        
        const htmlFiles = Object.keys(zip.files).filter(f => f.endsWith('.html') || f.endsWith('.htm')).slice(0, 8);
        for (const f of htmlFiles) {
          const content = await zip.file(f)?.async("string");
          if (content) textContext += `\nISI KONTEN FILE (${f}):\n${content.replace(/<[^>]*>?/gm, ' ').substring(0, 2500)}`;
        }
        setState(prev => ({ ...prev, progress: 50 }));
      }

      if (state.files.videoOpening) {
        videoOpeningFrames = await extractFramesFromVideo(state.files.videoOpening);
      }
      if (state.files.videoClosing) {
        videoClosingFrames = await extractFramesFromVideo(state.files.videoClosing);
      }

      setState(prev => ({ ...prev, progress: 75 }));
      
      const fileName = state.files.pdf?.name || state.files.scorm?.name || "Aset Pembelajaran";
      const result = await analyzeLearningAsset({ 
        imageParts, 
        textContext, 
        videoOpeningFrames, 
        videoClosingFrames 
      }, fileName);

      saveToHistory(result);
      setState(prev => ({ ...prev, isAnalyzing: false, report: result, view: 'report', progress: 100 }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isAnalyzing: false, error: "Gagal memproses audit. Silakan periksa format file Anda." }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onNavigate={(v) => setState(prev => ({ ...prev, view: v }))} activeView={state.view} />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {state.isAnalyzing ? (
          <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-pulse">
            <div className="relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Analisis Aset Sedang Berjalan...</h3>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div className="bg-emerald-600 h-full transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${state.progress}%` }}></div>
              </div>
              <p className="text-sm text-slate-500 font-medium">Mentor AI sedang meninjau kriteria pedoman aset Anda secara mendalam...</p>
            </div>
          </div>
        ) : state.view === 'report' && state.report ? (
          <ReportView report={state.report} onReset={() => {
            setState(prev => ({ ...prev, view: 'home', report: null, files: { pdf: null, scorm: null, videoOpening: null, videoClosing: null } }));
            setActiveSource(null);
          }} />
        ) : state.view === 'guideline' ? (
          <GuidelineView onNavigate={(v) => setState(prev => ({ ...prev, view: v }))} />
        ) : state.view === 'history' ? (
          <div className="max-w-4xl mx-auto py-10">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Riwayat Penilaian PTP
            </h2>
            <div className="grid gap-5">
              {state.history.length > 0 ? state.history.map(item => (
                <div key={item.id} onClick={() => setState(prev => ({ ...prev, report: item, view: 'report' }))} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-emerald-500 cursor-pointer flex justify-between items-center group shadow-sm transition-all hover:shadow-xl">
                  <div className="flex gap-6 items-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">{item.overallScore}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 transition-colors">{item.assetName}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-all uppercase tracking-widest">Detail Laporan</div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">Belum ada riwayat penilaian aset.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-5">
              <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">SmartAset v 1.0 Professional</div>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">Pusat Analisis <span className="text-emerald-600">Aset Belajar.</span></h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">Unggah salah satu sumber aset pembelajaran Anda untuk audit kriteria sesuai standar.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Exclusive Source Picker */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
                  <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
                    <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">1. Dokumen Aset Utama</h3>
                    <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100">Analisis Eksklusif</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PDF OPTION */}
                    <div className={`relative p-8 rounded-[2rem] border-4 transition-all group ${activeSource === 'pdf' ? 'border-emerald-500 bg-emerald-50/50 scale-105 shadow-lg' : activeSource === 'scorm' ? 'opacity-30 border-slate-50 grayscale' : 'border-slate-50 bg-slate-50/30 hover:border-emerald-200'}`}>
                      {activeSource !== 'scorm' && <input type="file" accept=".pdf" onChange={(e) => handleFileUpload('pdf', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />}
                      <div className="flex flex-col items-center gap-5 text-center relative z-0">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-lg ${activeSource === 'pdf' ? 'bg-emerald-600 text-white' : 'bg-white text-rose-500'}`}>
                           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Dokumen PDF</h4>
                          <p className="text-xs text-slate-400 mt-1 font-bold">{state.files.pdf ? state.files.pdf.name : 'Slide/Dokumen Belajar'}</p>
                        </div>
                        {activeSource === 'pdf' && (
                          <button onClick={(e) => {e.stopPropagation(); handleFileUpload('pdf', null)}} className="text-[10px] font-black text-rose-500 underline uppercase mt-2 hover:text-rose-700">Ganti ke SCORM</button>
                        )}
                      </div>
                    </div>

                    {/* SCORM OPTION */}
                    <div className={`relative p-8 rounded-[2rem] border-4 transition-all group ${activeSource === 'scorm' ? 'border-emerald-500 bg-emerald-50/50 scale-105 shadow-lg' : activeSource === 'pdf' ? 'opacity-30 border-slate-50 grayscale' : 'border-slate-50 bg-slate-50/30 hover:border-emerald-200'}`}>
                      {activeSource !== 'pdf' && <input type="file" accept=".zip" onChange={(e) => handleFileUpload('scorm', e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />}
                      <div className="flex flex-col items-center gap-5 text-center relative z-0">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-lg ${activeSource === 'scorm' ? 'bg-emerald-600 text-white' : 'bg-white text-blue-500'}`}>
                           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Paket SCORM</h4>
                          <p className="text-xs text-slate-400 mt-1 font-bold">{state.files.scorm ? state.files.scorm.name : 'File Interaktif .zip'}</p>
                        </div>
                        {activeSource === 'scorm' && (
                          <button onClick={(e) => {e.stopPropagation(); handleFileUpload('scorm', null)}} className="text-[10px] font-black text-rose-500 underline uppercase mt-2 hover:text-rose-700">Ganti ke PDF</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Videos Slot */}
              <div className="space-y-6">
                 <div className="bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-800 shadow-2xl h-full flex flex-col">
                    <h3 className="font-black text-white text-lg uppercase tracking-widest border-b border-slate-800 pb-5 mb-8">2. Berkas Video</h3>
                    <div className="space-y-10 flex-grow">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Video Pengantar</label>
                           <input type="file" accept="video/*" onChange={(e) => setState(prev => ({ ...prev, files: { ...prev.files, videoOpening: e.target.files?.[0] || null }}))} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Video Penutup</label>
                           <input type="file" accept="video/*" onChange={(e) => setState(prev => ({ ...prev, files: { ...prev.files, videoClosing: e.target.files?.[0] || null }}))} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer" />
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-800">
                       <p className="text-[9px] text-slate-500 font-bold leading-tight">Video akan di-analisis naskahnya (Sapaan ASN & Layar Penutup Medsos).</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 mt-12">
              <button 
                onClick={startAnalysis}
                disabled={state.isAnalyzing || !activeSource}
                className="group relative w-full max-w-2xl py-8 bg-emerald-600 text-white text-3xl font-black rounded-[3rem] shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:grayscale overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-4">
                   PROSES ANALISIS KOMPREHENSIF
                   <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
              {state.error && <div className="px-8 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl border-2 border-rose-100 animate-bounce uppercase text-xs tracking-widest">{state.error}</div>}
            </div>
          </div>
        )}
      </main>

      <footer className="py-16 border-t border-slate-100 bg-white">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
            <div className="flex items-center gap-6 opacity-40 grayscale">
               <div className="h-8 w-px bg-slate-300"></div>
               <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Kemenkes CorpU Standard</span>
               <div className="h-8 w-px bg-slate-300"></div>
            </div>
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">SmartAset v 1.0 • PTP Professional Analysis System</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
