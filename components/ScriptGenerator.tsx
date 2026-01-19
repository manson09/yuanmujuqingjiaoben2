import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Download, Sparkles, AlertCircle, Map, Users } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, ScriptSegment, GlobalContextHandler } from '../types';
import { generateScriptSegment } from '../services/geminiService';

interface ScriptGeneratorProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ files, addGeneratedFile, registerContext }) => {
  const novels = files.filter(f => f.type === FileType.NOVEL);
  const formatRefs = files.filter(f => f.type === FileType.FORMAT_REF);
  const styleRefs = files.filter(f => f.type === FileType.STYLE_REF);
  const outlines = files.filter(f => f.type === FileType.SEASON_OUTLINE);
  const characterBibles = files.filter(f => f.type === FileType.CHARACTER_BIBLE);

  const [selectedNovelId, setSelectedNovelId] = useState<string>(novels[0]?.id || '');
  const [selectedOutlineId, setSelectedOutlineId] = useState<string>(''); 
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [selectedBibleId, setSelectedBibleId] = useState<string>(''); // New
  const [mode, setMode] = useState<FrequencyMode>(FrequencyMode.MALE);
  const [episodeStart, setEpisodeStart] = useState<number>(1);
  
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-select first novel if available
  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) {
      setSelectedNovelId(novels[0].id);
    }
  }, [novels]);

  // Auto-select first outline if available
  useEffect(() => {
    if (!selectedOutlineId && outlines.length > 0) {
      setSelectedOutlineId(outlines[0].id);
    }
  }, [outlines]);
  
  // Auto-select first bible if available
  useEffect(() => {
    if (!selectedBibleId && characterBibles.length > 0) {
      setSelectedBibleId(characterBibles[0].id);
    }
  }, [characterBibles]);

  const handleGenerate = async (regenerateId?: string) => {
    if (!selectedNovelId) {
      setErrorMsg("请先选择一本原著小说");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    const novel = files.find(f => f.id === selectedNovelId);
    const formatRef = files.find(f => f.id === selectedFormatId);
    const styleRef = files.find(f => f.id === selectedStyleId);
    const outlineRef = files.find(f => f.id === selectedOutlineId);
    const bibleRef = files.find(f => f.id === selectedBibleId);
    
    // Determine range and previous context
    let rangeLabel = `${episodeStart}-${episodeStart + 2}集`;
    let previousSummary = "";
    let previousEndContent = ""; 
    let targetSegmentId: string = crypto.randomUUID();

    if (regenerateId) {
      // Regenerating existing segment
      const existingSeg = segments.find(s => s.id === regenerateId);
      if (existingSeg) {
        rangeLabel = existingSeg.range;
        targetSegmentId = regenerateId;
        const index = segments.findIndex(s => s.id === regenerateId);
        if (index > 0) {
            previousSummary = segments[index - 1].summary;
            const prevContent = segments[index - 1].content;
            previousEndContent = prevContent.length > 1000 ? prevContent.slice(-1000) : prevContent;
        }
        
        // Update loading state
        setSegments(prev => prev.map(s => s.id === regenerateId ? { ...s, isLoading: true } : s));
      }
    } else {
      // New segment
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        previousSummary = lastSegment.summary;
        const prevContent = lastSegment.content;
        previousEndContent = prevContent.length > 1000 ? prevContent.slice(-1000) : prevContent;
        
        setEpisodeStart(prev => prev + 3);
        rangeLabel = `${episodeStart}-${episodeStart + 2}集`;
      }
      
      const newSegment: ScriptSegment = {
        id: targetSegmentId,
        range: rangeLabel,
        content: "",
        summary: "",
        isLoading: true
      };
      setSegments(prev => [...prev, newSegment]);
    }

    try {
      const result = await generateScriptSegment(
        novel?.content || "",
        formatRef?.content || "",
        styleRef?.content || "",
        outlineRef?.content || "", 
        bibleRef?.content || "", // Pass Bible Content
        mode,
        rangeLabel,
        previousSummary,
        previousEndContent 
      );

      setSegments(prev => prev.map(s => 
        s.id === targetSegmentId 
          ? { ...s, content: result.content, summary: result.summary, isLoading: false } 
          : s
      ));

      addGeneratedFile(`脚本-${novel?.name}-${rangeLabel}`, result.content, FileType.GENERATED_SCRIPT);

      if (!regenerateId) {
          setEpisodeStart(prev => prev + 3);
      }

    } catch (err) {
      setErrorMsg("生成失败，请检查 API Key 或网络连接。");
      setSegments(prev => prev.filter(s => s.id !== targetSegmentId || !s.isLoading)); 
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (segment: ScriptSegment) => {
    const blob = new Blob([segment.content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `漫改脚本_${segment.range}.doc`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateSegmentContent = (id: string, newContent: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  // Register the last added segment by default if available
  useEffect(() => {
      if (segments.length > 0) {
          const lastSeg = segments[segments.length - 1];
          if (!lastSeg.isLoading) {
             registerContext({
                 name: `脚本 (${lastSeg.range})`,
                 getValue: () => lastSeg.content,
                 setValue: (val) => updateSegmentContent(lastSeg.id, val)
             });
          }
      }
  }, [segments.length, registerContext]); // Minimal dependency to avoid loop

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Sidebar Controls */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 sticky top-24">
          <div className="space-y-4 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm">输入素材</h4>
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">1. 原著小说 (核心)</label>
                <select
                value={selectedNovelId}
                onChange={(e) => setSelectedNovelId(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                <option value="">-- 请选择 --</option>
                {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
                    <Map size={12}/> 2. 季度大纲 (节奏把控)
                </label>
                <select
                value={selectedOutlineId}
                onChange={(e) => setSelectedOutlineId(e.target.value)}
                className="w-full text-sm border-emerald-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/50"
                >
                <option value="">-- 无 (自行把控) --</option>
                {outlines.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">建议先在[季度规划]中生成大纲</p>
            </div>

            <div>
                <label className="block text-xs font-medium text-orange-600 mb-1 flex items-center gap-1">
                    <Users size={12}/> 3. 人设圣经 (一致性)
                </label>
                <select
                value={selectedBibleId}
                onChange={(e) => setSelectedBibleId(e.target.value)}
                className="w-full text-sm border-orange-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-orange-50/50"
                >
                <option value="">-- 无 (自行推断) --</option>
                {characterBibles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">在[人物资料提取]中生成并保存</p>
            </div>
          </div>

          <div className="space-y-4 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm">风格约束</h4>
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">排版参考 (可选)</label>
                <select
                value={selectedFormatId}
                onChange={(e) => setSelectedFormatId(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                <option value="">-- 标准格式 --</option>
                {formatRefs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">文笔参考 (可选)</label>
                <select
                value={selectedStyleId}
                onChange={(e) => setSelectedStyleId(e.target.value)}
                className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500"
                >
                <option value="">-- 标准风格 --</option>
                {styleRefs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">频段模式</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode(FrequencyMode.MALE)}
                className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                  mode === FrequencyMode.MALE 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                男频 (爽快/成长)
              </button>
              <button
                onClick={() => setMode(FrequencyMode.FEMALE)}
                className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                  mode === FrequencyMode.FEMALE 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                女频 (情感/纠葛)
              </button>
            </div>
          </div>

          <div className="pt-2">
             <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">即将生成:</span>
                <span className="text-sm font-bold text-indigo-600">{episodeStart}-{episodeStart + 2} 集</span>
             </div>
             <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !selectedNovelId}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isGenerating ? (
                   <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    创作中...
                   </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    开始生成
                  </>
                )}
             </button>
             {errorMsg && (
               <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2">
                 <AlertCircle size={14} /> {errorMsg}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-9 space-y-6">
        {segments.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <Sparkles size={48} className="mb-4 text-slate-300" />
            <p>请在左侧配置并点击“开始生成”</p>
            <p className="text-sm mt-2">推荐先在“季度规划”中生成大纲，以获得更好的剧情连贯性</p>
          </div>
        ) : (
          segments.map((seg, index) => (
            <div 
                key={seg.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-24 focus-within:ring-2 focus-within:ring-indigo-500 transition-all" 
                id={`segment-${seg.id}`}
                onClick={() => {
                    // Manually register context on click to switch focus between segments
                    if (!seg.isLoading) {
                        registerContext({
                             name: `脚本 (${seg.range})`,
                             getValue: () => seg.content,
                             setValue: (val) => updateSegmentContent(seg.id, val)
                        });
                    }
                }}
            >
              {/* Segment Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm">第 {seg.range}</span>
                </h3>
                <div className="flex items-center gap-2">
                   <button
                    onClick={() => handleGenerate(seg.id)}
                    disabled={isGenerating}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
                    title="重新生成此段落"
                  >
                    <RotateCcw size={16} /> <span className="hidden sm:inline">重生成</span>
                  </button>
                  <button
                    onClick={() => handleDownload(seg)}
                    disabled={seg.isLoading}
                    className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
                    title="下载Word文档"
                  >
                    <Download size={16} /> <span className="hidden sm:inline">下载排版文档</span>
                  </button>
                </div>
              </div>

              {/* Segment Content (Editable) */}
              <div className="p-0 min-h-[300px]">
                {seg.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                     <p className="text-slate-500 animate-pulse">AI 正在根据季度大纲与原著进行改编...</p>
                  </div>
                ) : (
                  <textarea
                    value={seg.content}
                    onChange={(e) => updateSegmentContent(seg.id, e.target.value)}
                    onFocus={() => {
                        registerContext({
                             name: `脚本 (${seg.range})`,
                             getValue: () => seg.content,
                             setValue: (val) => updateSegmentContent(seg.id, val)
                        });
                    }}
                    className="w-full h-full min-h-[500px] p-8 resize-y focus:outline-none font-mono text-sm leading-relaxed text-slate-700 block"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScriptGenerator;