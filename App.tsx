
import React, { useState, useCallback, useMemo } from 'react';
import { AppStatus, BatchItem, CaptionLength } from './types';
import { annotateImage } from './services/geminiService';
import Uploader from './components/Uploader';
import BulkItem from './components/BulkItem';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<CaptionLength>(CaptionLength.LONG);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(() => !localStorage.getItem('gemini_api_key'));

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processBatch = async (items: BatchItem[]) => {
    if (items.length === 0) return;
    setStatus(AppStatus.BATCH_PROCESSING);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let retries = 0;
      const maxRetries = 6;
      let success = false;

      setBatchItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing', error: undefined } : p));
      
      while (retries < maxRetries && !success) {
        try {
          const base64Data = await fileToBase64(item.file);
          // Pass the custom API key here
          const caption = await annotateImage(base64Data, item.file.type, selectedLength, apiKey);
          
          setBatchItems(prev => prev.map(p => p.id === item.id ? { 
            ...p, 
            status: 'success', 
            result: caption,
            selected: true,
            error: undefined
          } : p));
          success = true;
          
          // Throttling: Small delay between successful requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 3500));
        } catch (err: any) {
          const errorMsg = err.message || JSON.stringify(err);
          const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota');
          
          if (isRateLimit && retries < maxRetries - 1) {
            retries++;
            const backoffTime = Math.pow(2, retries - 1) * 5000;
            
            setBatchItems(prev => prev.map(p => p.id === item.id ? { 
              ...p, 
              error: `Rate limited. Retrying in ${backoffTime/1000}s...` 
            } : p));
            
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            setBatchItems(prev => prev.map(p => p.id === item.id ? { 
              ...p, 
              status: 'error', 
              error: errorMsg 
            } : p));
            break; 
          }
        }
      }
    }
    
    setStatus(AppStatus.SUCCESS);
  };

  const handleImagesSelect = useCallback(async (files: FileList) => {
    setError(null);
    const newItems: BatchItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      selected: false
    }));

    setBatchItems(newItems);
    setStatus(AppStatus.READY_TO_PROCESS);
  }, [selectedLength, apiKey]);

  const handleStartProcessing = () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      alert("Please configure your Google Gemini API Key first.");
      return;
    }
    processBatch(batchItems);
  };

  const handleRegenerateSelected = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      alert("Please configure your Google Gemini API Key first.");
      return;
    }

    const selectedItems = batchItems.filter(item => item.selected && item.status !== 'processing');
    if (selectedItems.length === 0) return;
    
    setBatchItems(prev => prev.map(item => 
      item.selected && item.status !== 'processing' 
        ? { ...item, status: 'pending', result: undefined, error: undefined } 
        : item
    ));
    
    processBatch([...selectedItems]);
  };

  const toggleSelect = (id: string) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateCaption = (id: string, newCaption: string) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, result: newCaption } : item
    ));
  };

  const selectAll = (select: boolean) => {
    setBatchItems(prev => prev.map(item => 
      (item.status === 'success' || item.status === 'error') ? { ...item, selected: select } : item
    ));
  };

  const reset = () => {
    batchItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setStatus(AppStatus.IDLE);
    setBatchItems([]);
    setError(null);
  };

  const downloadZip = async () => {
    const selectedItems = batchItems.filter(item => item.selected && item.status === 'success');
    if (selectedItems.length === 0) return;

    const zip = new JSZip();
    selectedItems.forEach(item => {
      const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
      zip.file(`${baseName}.txt`, item.result || "");
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DevuCaption_Batch_${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const selectedItems = batchItems.filter(item => item.selected && item.status === 'success');
    if (selectedItems.length === 0) return;

    const bom = "\uFEFF"; // Byte Order Mark for Excel compatibility
    const header = "Filename,Caption\n";
    const rows = selectedItems.map(item => {
        const safeCaption = (item.result || "").replace(/"/g, '""'); // Escape double quotes
        return `"${item.file.name}","${safeCaption}"`;
    }).join("\n");

    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DevuCaption_Batch_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const stats = useMemo(() => {
    const total = batchItems.length;
    const success = batchItems.filter(i => i.status === 'success').length;
    const selected = batchItems.filter(i => i.selected).length;
    const successSelected = batchItems.filter(i => i.selected && i.status === 'success').length;
    const error = batchItems.filter(i => i.status === 'error').length;
    const processing = batchItems.filter(i => i.status === 'processing').length;
    const progress = total > 0 ? ((success + error) / total) * 100 : 0;
    return { total, success, selected, successSelected, error, processing, progress };
  }, [batchItems]);

  const lengthOptions = [
    { id: CaptionLength.ONE_LINE, label: 'One Line' },
    { id: CaptionLength.VERY_SHORT, label: 'Very Short' },
    { id: CaptionLength.SHORT, label: 'Short' },
    { id: CaptionLength.LONG, label: 'Long' },
    { id: CaptionLength.VERY_LONG, label: 'Very Long' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Animated Gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-drift"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-drift" style={{ animationDelay: '-5s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={reset}>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 text-xl group-hover:rotate-12 transition-transform duration-300 animate-float">D</div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-400 to-slate-400 bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent">DevuCaption</span>
              <div className="text-[10px] text-slate-500 font-medium tracking-wide group-hover:text-slate-400 transition-colors">Expert AI Dataset Annotator</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                apiKey ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {apiKey ? 'API Key Configured' : 'Set API Key'}
            </button>

            <a 
              href="https://github.com/Devgghya" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex flex-col items-end group relative"
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Created By</span>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-all">Devgghya Kulshrestha</span>
              <div className="absolute -bottom-1 right-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
            </a>
          </div>
        </div>

        {/* API Key Input Modal (centered with overlay) */}
        {showApiKeyInput && (
          <>
            <div
              onClick={() => setShowApiKeyInput(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl transform transition-all animate-in zoom-in">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Custom Gemini API Key
                </h3>

                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  Enter your own Google Gemini API key to bypass shared rate limits. Your key is stored locally in your browser.
                </p>

                <input
                  type="password"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your Google Gemini API key"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors mb-4"
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Get API Key
                  </a>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowApiKeyInput(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => { setShowApiKeyInput(false); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 tracking-tighter">
            Universal Batch <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Captioning</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto italic font-light animate-pulse-slow">
            "High-fidelity visual descriptions for all image types, optimized for LoRa training."
          </p>

          <div className="inline-flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-8 shadow-2xl animate-in zoom-in duration-500">
            {lengthOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedLength(opt.id)}
                className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  selectedLength === opt.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {status === AppStatus.IDLE && (
            <div className="hover:scale-[1.01] transition-transform duration-500">
              <Uploader onImagesSelect={handleImagesSelect} isLoading={false} />
            </div>
          )}

          {status !== AppStatus.IDLE && batchItems.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Progress Summary / Confirmation Header */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl shadow-2xl hover:border-slate-700 transition-colors group">
                
                {status === AppStatus.READY_TO_PROCESS ? (
                    <div className="flex flex-col items-center justify-center text-center py-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                            Ready to Process {batchItems.length} Images
                        </h3>
                        <p className="text-slate-400 mb-8 max-w-lg font-medium">
                            Review your queue below. Click "Start Captioning" to begin analyzing your images using your configured API key.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button 
                                onClick={handleStartProcessing}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl transition-all duration-300 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <span>Start Captioning</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button 
                                onClick={reset}
                                className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-lg rounded-2xl transition-all duration-300 border border-slate-700 hover:border-slate-500 hover:-translate-y-1 active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10">
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">
                                {status === AppStatus.BATCH_PROCESSING ? 'Analyzing Dataset...' : 'Generation Complete'}
                            </span>
                            <span className="text-sm font-mono text-blue-400 font-bold">{Math.round(stats.progress)}%</span>
                            </div>
                            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-1">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                                style={{ width: `${stats.progress}%` }}
                            ></div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            {stats.selected > 0 && (
                            <button 
                                onClick={handleRegenerateSelected}
                                disabled={status === AppStatus.BATCH_PROCESSING}
                                className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-900/30 flex items-center gap-2 whitespace-nowrap group/regen ${status === AppStatus.BATCH_PROCESSING ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:scale-105 active:scale-95 animate-pulse-glow'}`}
                                title="Regenerate captions for selected images with current length settings"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/regen:rotate-180 transition-transform duration-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Regenerate ({stats.selected})
                            </button>
                            )}
                            {stats.successSelected > 0 && (
                              <div className="flex gap-2">
                                <button 
                                    onClick={downloadZip}
                                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-blue-900/30 flex items-center gap-2 whitespace-nowrap group/btn hover:-translate-y-1 hover:scale-105 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    ZIP
                                </button>
                                <button 
                                    onClick={downloadCsv}
                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-900/30 flex items-center gap-2 whitespace-nowrap group/btn hover:-translate-y-1 hover:scale-105 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    CSV
                                </button>
                              </div>
                            )}
                            <button 
                            onClick={reset}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all duration-300 border border-slate-700 whitespace-nowrap hover:text-white hover:-translate-y-1 active:scale-95"
                            >
                            New Batch
                            </button>
                        </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-6 mb-2">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => selectAll(true)}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider bg-blue-400/10 px-4 py-2 rounded-xl transition-all hover:bg-blue-400/20 active:scale-95"
                                >
                                    Select All (Succ/Err)
                                </button>
                                <button 
                                    onClick={() => selectAll(false)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider bg-slate-800 px-4 py-2 rounded-xl transition-all hover:bg-slate-700 active:scale-95"
                                >
                                    Deselect All
                                </button>
                            </div>
                            <div className="flex gap-8">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Total</span>
                                    <span className="text-2xl font-black text-slate-200">{stats.total}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-green-500 font-bold uppercase mb-1 tracking-widest">Success</span>
                                    <span className="text-2xl font-black text-green-400">{stats.success}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-red-500 font-bold uppercase mb-1 tracking-widest">Failed</span>
                                    <span className="text-2xl font-black text-red-400">{stats.error}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {batchItems.map((item, index) => (
                  <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                    <BulkItem 
                      item={item} 
                      onToggleSelect={toggleSelect}
                      onUpdateCaption={updateCaption}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === AppStatus.ERROR && !batchItems.length && (
            <div className="p-16 bg-red-900/10 border border-red-900/50 rounded-[3rem] text-center shadow-3xl animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-red-400 mb-4 tracking-tighter">Operation Failed</h2>
              <p className="text-red-300/80 mb-10 max-w-md mx-auto text-lg italic">"{error}"</p>
              <button 
                onClick={reset}
                className="px-10 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black tracking-widest uppercase transition-all border border-slate-700 text-sm hover:-translate-y-1 active:scale-95"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-8 group">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-lg shadow-blue-500/20 transition-transform group-hover:rotate-[360deg] duration-700">D</div>
                <span className="text-2xl font-black tracking-tighter">DevuCaption</span>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Developer</p>
                <a 
                    href="https://github.com/Devgghya" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-2xl font-black text-slate-200 hover:text-blue-400 transition-all duration-300 relative group"
                >
                    Devgghya Kulshrestha
                    <span className="absolute left-0 -bottom-1 w-0 h-1 bg-blue-600 transition-all duration-500 group-hover:w-full"></span>
                </a>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed text-base font-medium">
                Professional image annotation utility. Supports multiple aspect ratios, lighting conditions, and diverse subjects. Tailored for Flux.1 and SDXL LoRa training.
              </p>
            </div>
            <div>
              <h4 className="font-black mb-8 text-xs uppercase tracking-[0.2em] text-slate-400">Features</h4>
              <ul className="text-base text-slate-500 space-y-4 font-semibold">
                <li className="flex items-center gap-3 group/li">
                  <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  <span className="group-hover:text-blue-400 transition-colors">Inline Editing</span>
                </li>
                <li className="flex items-center gap-3 group/li">
                  <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  <span className="group-hover:text-blue-400 transition-colors">Multi-Length Logic</span>
                </li>
                <li className="flex items-center gap-3 group/li">
                  <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform"></span>
                  <span className="group-hover:text-blue-400 transition-colors">Bulk ZIP Export</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-8 text-xs uppercase tracking-[0.2em] text-slate-400">Connect</h4>
              <div className="flex flex-col gap-4">
                <a href="https://github.com/Devgghya" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 hover:text-blue-400 flex items-center gap-3 transition-all hover:translate-x-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </div>
                  GitHub
                </a>
                <a href="https://www.instagram.com/devgghya/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 hover:text-pink-400 flex items-center gap-3 transition-all hover:translate-x-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  Instagram
                </a>
                <a href="https://www.linkedin.com/in/devgghya-kulshrestha-88909b314/" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 hover:text-blue-500 flex items-center gap-3 transition-all hover:translate-x-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </div>
                  LinkedIn
                </a>
                <a href="mailto:devgghyakulshrestha27@gmail.com" className="text-sm font-bold text-slate-500 hover:text-red-400 flex items-center gap-3 transition-all hover:translate-x-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  Email Me
                </a>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">© 2026 DevuCaption. Powered by Gemini Pro Vision.</p>
            <div className="flex gap-10">
               <span className="text-[10px] text-slate-800 font-black px-4 py-2 border border-slate-900 rounded-full bg-slate-900/50">BUILD: 2.7.5-PRO-X</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15%, 15%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(79, 70, 229, 0.4); }
          50% { box-shadow: 0 0 30px rgba(79, 70, 229, 0.7); }
        }
        .animate-drift { animation: drift 15s infinite ease-in-out; }
        .animate-float { animation: float 4s infinite ease-in-out; }
        .animate-gradient-text { animation: gradient-text 8s infinite linear; }
        .animate-pulse-slow { animation: pulse 6s infinite ease-in-out; }
        .animate-pulse-glow { animation: pulse-glow 2s infinite ease-in-out; }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.98); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
