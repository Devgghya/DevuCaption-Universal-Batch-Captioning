
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
      className={`flex flex-col items-center justify-center p-20 border-4 border-dashed rounded-[3rem] transition-all duration-700 cursor-pointer group relative overflow-hidden ${
        isLoading 
          ? 'border-slate-800 bg-slate-900/20 cursor-not-allowed shadow-none' 
          : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 hover:border-blue-500 shadow-2xl hover:shadow-[0_0_80px_rgba(59,130,246,0.15)] active:scale-[0.98]'
      }`} 
      onClick={triggerInput}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-700 pointer-events-none"></div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
        multiple
        disabled={isLoading}
      />
      
      <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 shadow-2xl ${
        isLoading ? 'bg-slate-800' : 'bg-blue-600 shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-blue-500/40'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-14 w-14 transition-all duration-500 ${isLoading ? 'text-slate-600' : 'text-white group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <h3 className="text-4xl font-black mb-4 tracking-tighter transition-colors group-hover:text-blue-400">Bulk Dataset Upload</h3>
      <p className="text-slate-400 text-center max-w-sm px-4 text-lg font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
        Drop your images here or click to start the expert annotation session.
      </p>
      
      <div className="mt-12 flex gap-4">
        <button 
          className={`px-12 py-4 bg-white text-slate-950 hover:bg-blue-500 hover:text-white rounded-[1.5rem] font-black uppercase tracking-widest transition-all duration-500 shadow-2xl flex items-center gap-3 active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'group-hover:translate-y-[-4px]'}`}
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
