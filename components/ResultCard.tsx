
import React, { useState } from 'react';
import { AnnotationResult } from '../types';

interface ResultCardProps {
  result: AnnotationResult;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="md:flex">
        <div className="md:w-1/2 p-4 bg-slate-950 flex items-center justify-center">
          <img 
            src={result.originalImage} 
            alt="Original" 
            className="max-h-[500px] rounded-lg object-contain shadow-lg border border-slate-800"
          />
        </div>
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Expert Caption</span>
            <button 
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Analyze New Image
            </button>
          </div>
          
          <div className="relative bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 min-h-[120px] flex items-center">
            <p className="text-lg text-slate-100 leading-relaxed italic font-light">
              "{result.caption}"
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={handleCopy}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copied ? 'Copied!' : 'Copy Caption'}
            </button>
            <button 
               onClick={onReset}
               className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Reset
            </button>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Annotation Specs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-500 mb-1">WORD COUNT</div>
                <div className="text-sm font-medium text-slate-300">{result.caption.split(' ').length} words</div>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-500 mb-1">FORMAT</div>
                <div className="text-sm font-medium text-slate-300">Single Sentence</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
