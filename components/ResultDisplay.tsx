
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AgentRole, StepStatus, ProjectState, ContentVersion, ProjectEvaluation } from '../types';
import { 
  CheckCircle, Send, Brain, ChevronDown, ChevronUp, Sparkles, MessageSquareQuote, 
  Maximize2, Minimize2, Star, ArrowRight, 
  BrainCircuit, Smartphone, Laptop, Tablet,
  PackageCheck, Bot,
  ThumbsUp, ThumbsDown, RotateCcw, Eraser,
  X, Command, Download, GripHorizontal, Eye,
  AlertTriangle, Hammer, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { exportProjectAsWindowsPackage } from '../services/exportService';

interface Props {
  project: ProjectState;
  onAccept: (role: AgentRole) => void;
  onRequestFix?: () => void;
  onFeedback: (role: AgentRole, feedback: string) => void;
  onFinalEvaluation?: (evaluation: ProjectEvaluation) => void;
  onRestoreVersion?: (role: AgentRole, version: ContentVersion) => void;
  onRateVersion?: (role: AgentRole, versionId: string, rating: 'like' | 'dislike') => void;
  isProcessing: boolean;
}

const MarkupCanvas: React.FC<{ 
  isActive: boolean, 
  onSave: (dataUrl: string | null) => void,
  width: number,
  height: number
}> = ({ isActive, onSave, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ef4444'; 
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isActive, width, height]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isActive) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasContent(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasContent && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        onSave(null);
      }
    }
  };

  return (
    <div className={`absolute inset-0 z-50 transition-opacity duration-300 ${isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <canvas 
        ref={canvasRef}
        width={width * 2}
        height={height * 2}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair bg-red-500/5"
      />
      {isActive && (
        <button 
          onClick={clear}
          className="absolute bottom-6 right-6 p-3 bg-slate-900 shadow-2xl border border-white/10 text-red-400 hover:text-white rounded-xl transition-all"
          title="清除当前评注"
        >
          <Eraser size={18} />
        </button>
      )}
    </div>
  );
};

const VersionItem: React.FC<{ 
  version: ContentVersion, 
  isLast: boolean, 
  role: AgentRole, 
  index: number,
  onRestore?: () => void,
  onRate?: (rating: 'like' | 'dislike') => void,
  onMarkupUpdate?: (dataUrl: string | null) => void
}> = ({ version, isLast, role, index, onRestore, onRate, onMarkupUpdate }) => {
  const [showThinking, setShowThinking] = useState(isLast && role !== AgentRole.DESIGNER);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(650);
  const [isResizing, setIsResizing] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  
  const extractIframeContent = (content: string) => {
    if (!content) return null;
    const htmlBlockMatch = content.match(/```html\s*([\s\S]*?)\s*```/i);
    if (htmlBlockMatch) return htmlBlockMatch[1].trim();
    const genericBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/i);
    if (genericBlockMatch && genericBlockMatch[1].trim().startsWith('<')) {
      return genericBlockMatch[1].trim();
    }
    const fullDocMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (fullDocMatch) return fullDocMatch[0];
    const htmlTagMatch = content.match(/<html[\s\S]*?<\/html>/i);
    if (htmlTagMatch) return htmlTagMatch[0];
    const divFragmentMatch = content.match(/<div[\s\S]*<\/div>/i);
    if (divFragmentMatch) return divFragmentMatch[0];
    return null;
  };

  const previewHtml = extractIframeContent(version.content);

  useEffect(() => {
    if (previewHtml) {
      let finalHtml = previewHtml;
      const hasDocType = /<!DOCTYPE html>/i.test(finalHtml);
      const hasHtmlTag = /<html/i.test(finalHtml);
      const hasHeadTag = /<head/i.test(finalHtml);
      const hasBodyTag = /<body/i.test(finalHtml);

      const helperScript = `
        <script>
          window.onerror = function(msg, url, line) { console.error("Preview Error:", msg); };
          function navigateTo(id) {
            const target = document.getElementById(id) || document.querySelector('[data-page="' + id + '"]');
            if (target) {
              document.querySelectorAll('.screen, .page, section[id]').forEach(s => {
                s.style.display = 'none';
                s.classList.remove('active');
              });
              target.style.display = 'block';
              setTimeout(() => target.classList.add('active'), 10);
            }
          }
          window.addEventListener('load', function() {
            const first = document.querySelector('.screen') || document.body.firstElementChild;
            if (first) {
              document.querySelectorAll('.screen, .page, section[id]').forEach(s => s.style.display = 'none');
              first.style.display = 'block';
              first.classList.add('active');
            }
          });
        </script>
      `;
      
      const helperStyle = `
        <style>
           ::-webkit-scrollbar { width: 6px; }
           ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
           body { margin: 0; padding: 0; min-height: 100vh; overflow-x: hidden; background: white; }
           .screen { display: none; opacity: 0; transition: opacity 0.3s; }
           .screen.active { display: block; opacity: 1; }
        </style>
      `;

      if (hasHtmlTag || hasDocType) {
          if (!finalHtml.includes('cdn.tailwindcss.com')) {
              finalHtml = finalHtml.replace(/<head[^>]*>/i, '$&<script src="https://cdn.tailwindcss.com"></script>');
          }
          if (hasHeadTag) {
              finalHtml = finalHtml.replace(/<\/head>/i, `${helperStyle}</head>`);
          } else {
              finalHtml = finalHtml.replace(/<html[^>]*>/i, '$&<head>' + helperStyle + '</head>');
          }
          if (hasBodyTag) {
              finalHtml = finalHtml.replace(/<\/body>/i, `${helperScript}</body>`);
          } else {
              finalHtml = finalHtml + helperScript;
          }
      } else {
          finalHtml = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>${helperStyle}</head><body>${finalHtml}${helperScript}</body></html>`;
      }
      
      const blob = new Blob([finalHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [previewHtml]);

  const handleDownload = () => {
    const blob = new Blob([role === AgentRole.DESIGNER && previewHtml ? previewHtml : version.content], { 
      type: role === AgentRole.DESIGNER ? 'text/html' : 'text/markdown' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${role}_v${index + 1}.${role === AgentRole.DESIGNER ? 'html' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      setPreviewHeight(Math.max(300, Math.min(2000, e.clientY - 200)));
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const renderSpecializedContent = () => {
    if (role === AgentRole.DESIGNER) {
      if (!blobUrl) {
        return (
          <div className="bg-[var(--panel-bg)] border border-red-500/20 rounded-[2.5rem] p-12 text-center space-y-4 shadow-xl">
             <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-bold text-[var(--text-main)]">无法解析设计稿代码</h3>
          </div>
        );
      }

      const dWidth = previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : 1200;

      return (
        <div className="space-y-6">
          <div className="bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--glass-border)] shadow-inner">
                  {(['mobile', 'tablet', 'desktop'] as const).map((d) => (
                    <button 
                      key={d}
                      onClick={() => setPreviewDevice(d)}
                      className={`p-2.5 rounded-lg transition-all ${previewDevice === d ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                    >
                      {d === 'mobile' ? <Smartphone size={18} /> : d === 'tablet' ? <Tablet size={18} /> : <Laptop size={18} />}
                    </button>
                  ))}
                </div>
                <div className="flex bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--glass-border)]">
                  <button onClick={() => setIsMarkupMode(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${!isMarkupMode ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)]'}`}>
                    交互预览
                  </button>
                  <button onClick={() => setIsMarkupMode(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${isMarkupMode ? 'bg-red-600 text-white' : 'text-[var(--text-muted)]'}`}>
                    视觉评注
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownload} className="p-3 bg-[var(--glass-border)] hover:bg-emerald-500/20 text-[var(--text-muted)] hover:text-emerald-400 rounded-xl transition-all">
                  <Download size={18} />
                </button>
                <button onClick={() => setIsFullscreen(true)} className="p-3 bg-[var(--glass-border)] hover:bg-[var(--glass-border)] text-[var(--text-main)] rounded-xl transition-all">
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex justify-center bg-[var(--bg-main)]/50 rounded-[2rem] p-10 border border-[var(--glass-border)] relative">
              <div 
                style={{ height: `${previewHeight}px` }}
                className={`transition-all duration-300 bg-white shadow-2xl overflow-hidden relative rounded-[2rem] border-[8px] border-slate-900 ${
                  previewDevice === 'mobile' ? 'w-[375px]' : 
                  previewDevice === 'tablet' ? 'w-[768px]' : 
                  'w-full max-w-[1200px]'
                }`}
              >
                <MarkupCanvas isActive={isMarkupMode} onSave={(data) => onMarkupUpdate?.(data)} width={dWidth} height={previewHeight} />
                <iframe src={blobUrl} sandbox="allow-scripts allow-modals allow-popups" className={`w-full h-full border-none transition-all duration-500 ${isMarkupMode ? 'opacity-80 blur-[1px] pointer-events-none' : 'opacity-100'}`} />
              </div>
              <div onMouseDown={startResize} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-8 cursor-ns-resize flex items-center justify-center group/handle rounded-full hover:bg-white/5">
                <GripHorizontal className="text-slate-600 group-hover/handle:text-blue-500" size={20} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-[var(--panel-bg)] border ${isLast ? 'border-blue-500/30 active-glow' : 'border-[var(--glass-border)]'} rounded-[2.5rem] p-10 shadow-xl backdrop-blur-md relative`}>
        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleDownload} className="p-3 bg-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl transition-all">
             <Download size={18} />
          </button>
        </div>
        <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none 
          prose-h1:text-4xl prose-h1:font-black prose-p:text-[var(--text-main)] prose-li:text-[var(--text-main)]
          prose-h2:text-blue-400 prose-pre:bg-slate-900 prose-code:text-blue-400`}>
          <ReactMarkdown>{version.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 group animate-in fade-in slide-in-from-bottom-4 duration-700">
      {version.feedbackTrigger && (
        <div className="flex flex-col items-end gap-2">
          <div className="max-w-[80%] bg-blue-600/90 text-white px-8 py-5 rounded-[2rem] rounded-tr-none text-base font-medium shadow-xl">
            {version.feedbackTrigger}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-black px-4 uppercase tracking-[0.2em]">用户迭代指令</span>
        </div>
      )}

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
             <div className={`w-12 h-12 rounded-2xl bg-[var(--glass-border)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] shadow-lg`}>
                <Bot size={24} />
             </div>
             <div>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{role} 节点产出</span>
                 <span className="text-[9px] bg-[var(--glass-border)] text-[var(--text-muted)] px-3 py-1 rounded-full font-bold">版本 v{index + 1}</span>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-4">
            {!isLast && onRestore && (
              <button onClick={onRestore} className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--glass-border)] rounded-xl">
                <RotateCcw size={18} />
              </button>
            )}
            <div className="flex items-center bg-[var(--glass-border)] rounded-xl border border-[var(--glass-border)] p-1.5">
              <button onClick={() => onRate?.('like')} className={`p-2 rounded-lg ${version.rating === 'like' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[var(--text-muted)]'}`}><ThumbsUp size={16} /></button>
              <button onClick={() => onRate?.('dislike')} className={`p-2 rounded-lg ${version.rating === 'dislike' ? 'bg-red-500/20 text-red-400' : 'text-[var(--text-muted)]'}`}><ThumbsDown size={16} /></button>
            </div>
          </div>
        </div>
        <div className="pl-4 md:pl-16 space-y-8">{renderSpecializedContent()}</div>
      </div>
    </div>
  );
};

const ResultDisplay: React.FC<Props> = ({ project, onAccept, onRequestFix, onFeedback, onFinalEvaluation, onRestoreVersion, onRateVersion, isProcessing }) => {
  const [feedbackInput, setFeedbackInput] = useState('');
  const [markupData, setMarkupData] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentStepData = project.currentStep !== 'FINAL_EVALUATION' ? project.steps[project.currentStep as AgentRole] : null;

  const handleSendFeedback = () => {
    if (!feedbackInput && !markupData) return;
    onFeedback(project.currentStep as AgentRole, feedbackInput);
    setFeedbackInput(''); setMarkupData(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportProjectAsWindowsPackage(project);
    } catch (e: any) {
      alert("导出失败: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (project.currentStep === 'FINAL_EVALUATION' || project.status === StepStatus.PROJECT_COMPLETED) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-12 bg-[var(--bg-main)]">
        <div className="space-y-6">
           <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10">
              <PackageCheck size={48} />
           </div>
           <h2 className="text-6xl font-black text-[var(--text-main)] tracking-tighter">交付套件就绪</h2>
           <p className="text-xl text-[var(--text-muted)] font-medium max-w-lg">
             所有 Agent 协作已闭环。软件原型与技术方案已完成神经合成。
           </p>
        </div>

        <div className="bg-[var(--panel-bg)] border border-[var(--glass-border)] p-12 rounded-[4rem] w-full max-w-3xl shadow-3xl space-y-6">
           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 transition-all"
           >
              {isExporting ? <Loader2 className="animate-spin" size={32} /> : <Download size={32} />}
              {isExporting ? '合成 ZIP 归档中...' : '下载 Windows 离线套件'}
           </button>
           <button 
             onClick={() => window.location.reload()}
             className="w-full py-6 border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-[2rem] font-black text-lg transition-all"
           >
              重启引擎并重置
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)]">
      <div className="px-12 py-8 border-b border-[var(--glass-border)] flex justify-between items-center shrink-0 z-20 shadow-xl bg-[var(--bg-main)]">
        <div className="flex items-center gap-4">
           <h3 className="text-2xl font-black text-[var(--text-main)]">{project.currentStep} Studio</h3>
           {isProcessing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase">
                 <Loader2 size={12} className="animate-spin" /> 神经元计算中...
              </div>
           )}
        </div>
        {currentStepData?.status === StepStatus.AWAIT_REVIEW && !isProcessing && (
          <div className="flex gap-4">
            <button onClick={() => onAccept(project.currentStep as AgentRole)} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3">
              <CheckCircle size={20} /> 批准交付
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
        {currentStepData?.versions.map((v, idx) => (
          <VersionItem 
            key={v.id} 
            version={v} 
            isLast={idx === currentStepData.versions.length - 1} 
            role={project.currentStep as AgentRole} 
            index={idx} 
            onRestore={() => onRestoreVersion?.(project.currentStep as AgentRole, v)} 
            onRate={(rating) => onRateVersion?.(project.currentStep as AgentRole, v.id, rating)} 
            onMarkupUpdate={setMarkupData} 
          />
        ))}
        {isProcessing && (
           <div className="flex flex-col items-center justify-center p-20 space-y-6">
              <div className="w-16 h-16 bg-blue-600/10 rounded-[2rem] flex items-center justify-center text-blue-500 animate-pulse">
                 <BrainCircuit size={40} />
              </div>
              <p className="text-lg text-[var(--text-muted)] font-bold italic">“正在将抽象逻辑具象化...”</p>
           </div>
        )}
      </div>

      {!isProcessing && (
        <div className="p-8 bg-[var(--panel-bg)] border-t border-[var(--glass-border)] shadow-3xl">
          <div className="max-w-5xl mx-auto flex gap-6">
            <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="输入修改建议或反馈..." 
                 className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-[2.2rem] px-10 py-7 text-xl text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                 value={feedbackInput} 
                 onChange={(e) => setFeedbackInput(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} 
               />
               {markupData && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase">
                     <Eye size={12} /> 含视觉评注
                  </div>
               )}
            </div>
            <button 
              onClick={handleSendFeedback} 
              disabled={!feedbackInput && !markupData}
              className="w-20 h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <Send size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
