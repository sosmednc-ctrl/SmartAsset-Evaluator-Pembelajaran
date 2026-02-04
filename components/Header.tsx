
import React from 'react';

interface HeaderProps {
  onNavigate: (view: 'home' | 'history' | 'guideline') => void;
  activeView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, activeView }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="bg-emerald-600 p-2 rounded-lg shadow-sm shadow-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SmartAset</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Evaluator Aset Pembelajaran</p>
            </div>
          </div>
          <nav className="flex space-x-6 md:space-x-8">
            <button 
              onClick={() => onNavigate('home')}
              className={`text-sm font-bold transition-colors ${activeView === 'home' || activeView === 'report' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onNavigate('history')}
              className={`text-sm font-bold transition-colors ${activeView === 'history' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              Riwayat
            </button>
            <button 
              onClick={() => onNavigate('guideline')}
              className={`text-sm font-bold transition-colors ${activeView === 'guideline' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              Panduan Aset
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
