
import React, { useState, useEffect } from 'react';
import { BatchItem } from '../types';

interface BulkItemProps {
  item: BatchItem;
  onToggleSelect: (id: string) => void;
  onUpdateCaption: (id: string, newCaption: string) => void;
}

const BulkItem: React.FC<BulkItemProps> = ({ item, onToggleSelect, onUpdateCaption }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.result || "");

  useEffect(() => {
    if (item.result) {
      setEditedText(item.result);
    }
  }, [item.result]);

  const handleSave = () => {
    onUpdateCaption(item.id, editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(item.result || "");
    setIsEditing(false);
  };

  const handleDownload = () => {
    const blob = new Blob([item.result || ""], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
    a.href = url;
    a.download = `${baseName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isSelectable = item.status === 'success' || item.status === 'error';

  return (
    <div className={`flex flex-col gap-3 p-6 bg-slate-900/40 backdrop-blur-sm border rounded-[2rem] group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ${
      item.selected ? 'border-blue-500/50 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-slate-800 hover:border-slate-600'
    }`}>
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 mt-2">
          <input 
            type="checkbox" 
            checked={!!item.selected} 
            onChange={() => onToggleSelect(item.id)}
            disabled={item.status === 'processing'}
            className={`w-6 h-6 rounded-lg border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer transition-all ${item.status === 'processing' ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
          />
        </div>

        <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-950 border border-slate-800 shadow-lg group-hover:scale-105 transition-transform duration-500">
          <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          {item.status === 'processing' && (
            <div className="absolute inset-0 bg-blue-950/70 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {item.status === 'success' && (
            <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-0">
              <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-slate-200 truncate pr-4 group-hover:text-white transition-colors">{item.file.name}</h4>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${
              item.status === 'success' ? 'text-green-400 bg-green-400/10 border-green-500/20' :
              item.status === 'processing' ? 'text-blue-400 bg-blue-400/10 border-blue-500/20' :
              item.status === 'error' ? 'text-red-400 bg-red-400/10 border-red-500/20' :
              'text-slate-500 bg-slate-800 border-slate-700'
            }`}>
              {item.status}
            </span>
          </div>
          
          {item.status === 'success' && (
            <div className="space-y-3">
              {isEditing ? (
                <div className="space-y-3 animate-in zoom-in duration-300">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full bg-slate-950 border border-blue-500/40 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 min-h-[80px] resize-y custom-scrollbar shadow-inner"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSave}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/30"
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group/caption relative p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-slate-600 transition-all duration-300">
                  <p className="text-sm text-slate-300 italic leading-relaxed pr-10 font-medium">
                    "{item.result}"
                  </p>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/caption:opacity-100 transition-all duration-300">
                    <button 
                      onClick={handleDownload}
                      className="p-2 text-slate-500 hover:text-green-400 hover:bg-green-500/10 rounded-full transition-all hover:scale-110"
                      title="Download TXT"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-all hover:scale-110"
                      title="Edit Caption"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {item.error && (
            <div className="space-y-2">
              <p className="text-sm text-red-400 font-bold bg-red-400/10 p-4 rounded-2xl border border-red-500/20 italic">
                Error: {item.error}
              </p>
              {item.status === 'error' && !item.selected && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Select this item to retry regeneration</p>
              )}
            </div>
          )}

          {item.status === 'processing' && (
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mt-6 border border-slate-800 p-0.5">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 animate-[shimmer_2s_infinite] w-1/3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkItem;
