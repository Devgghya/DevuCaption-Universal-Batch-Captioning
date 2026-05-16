
import React, { useRef } from 'react';

interface UploaderProps {
  onImagesSelect: (files: FileList) => void;
  isLoading: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onImagesSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImagesSelect(files);
    }
  };

  const triggerInput = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center p-16 sm:p-20 border-2 border-dashed rounded-[2.5rem] transition-all duration-700 cursor-pointer group relative overflow-hidden ${
        isLoading 
          ? 'border-slate-300 bg-white/60 cursor-not-allowed shadow-none' 
          : 'border-slate-300 bg-white/70 hover:bg-white hover:border-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.12)] active:scale-[0.98]'
      }`} 
      onClick={triggerInput}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/0 to-orange-100/0 group-hover:from-teal-100/40 group-hover:to-orange-100/40 transition-all duration-700 pointer-events-none"></div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
        multiple
        disabled={isLoading}
      />
      
      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 shadow-2xl ${
        isLoading ? 'bg-slate-200' : 'bg-gradient-to-br from-teal-500 to-orange-500 shadow-teal-500/30 group-hover:scale-110 group-hover:-rotate-3'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-all duration-500 ${isLoading ? 'text-slate-400' : 'text-white group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <h3 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight text-slate-900 font-display">Bulk Dataset Upload</h3>
      <p className="text-slate-600 text-center max-w-sm px-4 text-lg font-medium leading-relaxed">
        Drop your images here or click to launch a high-precision caption run.
      </p>
      
      <div className="mt-12 flex gap-4">
        <button 
          className={`px-12 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-[1.5rem] font-black uppercase tracking-widest transition-all duration-500 shadow-2xl flex items-center gap-3 active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'group-hover:-translate-y-1'}`}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 font-bold" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Select Files
        </button>
      </div>
    </div>
  );
};

export default Uploader;
