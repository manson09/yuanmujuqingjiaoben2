import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Download, Sparkles, AlertCircle, Map, Users, Zap, Feather } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, ScriptSegment, GlobalContextHandler, ModelTier } from '../types';
import { generateScriptSegment } from '../services/geminiService';

interface ScriptGeneratorProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void;
  // 💡 持久化 Props (必须与 App.tsx 传参一致)
  segments: ScriptSegment[];
  setSegments: React.Dispatch<React.SetStateAction<ScriptSegment[]>>;
  episodeStart: number;
  setEpisodeStart: React.Dispatch<React.SetStateAction<number>>;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ 
  files, addGeneratedFile, registerContext,
  segments, setSegments, episodeStart, setEpisodeStart 
}) => {
  const novels = files.filter(f => f.type === FileType.NOVEL);
  const formatRefs = files.filter(f => f.type === FileType.FORMAT_REF);
  const styleRefs = files.filter(f => f.type === FileType.STYLE_REF);
  const outlines = files.filter(f => f.type === FileType.SEASON_OUTLINE);
  const characterBibles = files.filter(f => f.type === FileType.CHARACTER_BIBLE);

  const [selectedNovelId, setSelectedNovelId] = useState<string>(novels[0]?.id || '');
  const [selectedOutlineId, setSelectedOutlineId] = useState<string>(''); 
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [selectedBibleId, setSelectedBibleId] = useState<string>(''); 
  const [mode, setMode] = useState<FrequencyMode>(FrequencyMode.MALE);
  const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.CREATIVE_PRO); 
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 初始化选择
  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) setSelectedNovelId(novels[0].id);
    if (!selectedOutlineId && outlines.length > 0) setSelectedOutlineId(outlines[0].id);
    if (!selectedBibleId && characterBibles.length > 0) setSelectedBibleId(characterBibles[0].id);
  }, [novels, outlines, characterBibles]);

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
    
    let rangeLabel = "";
    let previousSummary = "";
    let previousEndContent = ""; 
    let targetSegmentId: string = regenerateId || crypto.randomUUID();

    if (regenerateId) {
      const existingSeg = segments.find(s => s.id === regenerateId);
      if (existingSeg) {
        rangeLabel = existingSeg.range;
        const index = segments.findIndex(s => s.id === regenerateId);
        if (index > 0) {
            previousSummary = segments[index - 1].summary;
            previousEndContent = segments[index - 1].content.slice(-1000);
        }
        setSegments(prev => prev.map(s => s.id === regenerateId ? { ...s, isLoading: true } : s));
      }
    } else {
      rangeLabel = `${episodeStart}-${episodeStart + 2}集`;
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        previousSummary = last.summary;
        previousEndContent = last.content.slice(-1000);
      }
      
      const newSegment: ScriptSegment = { id: targetSegmentId, range: rangeLabel, content: "", summary: "", isLoading: true };
      setSegments(prev => [...prev, newSegment]);
    }

    try {
      const result = await generateScriptSegment(
        novel?.content || "",
        formatRef?.content || "",
        styleRef?.content || "",
        outlineRef?.content || "", 
        bibleRef?.content || "", 
        mode,
        rangeLabel,
        previousSummary,
        previousEndContent,
        modelTier
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
      setErrorMsg("生成失败，请稍后重试。");
      if (!regenerateId) {
        setSegments(prev => prev.filter(s => s.id !== targetSegmentId));
      } else {
        setSegments(prev => prev.map(s => s.id === targetSegmentId ? { ...s, isLoading: false } : s));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSegmentContent = (id: string, newContent: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

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
  }, [segments.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 sticky top-24">
          <div className="space-y-2 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm">选择 AI 引擎</h4>
             <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setModelTier(ModelTier.CREATIVE_PRO)} className={`p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.CREATIVE_PRO ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                    <span className="text-sm font-bold flex items-center gap-1"><Feather size={14} /> 沉浸文笔版</span>
                </button>
                <button onClick={() => setModelTier(ModelTier.LOGIC_FAST)} className={`p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.LOGIC_FAST ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                    <span className="text-sm font-bold flex items-center gap-1"><Zap size={14} /> 极速逻辑版</span>
                </button>
             </div>
          </div>

          <div className="space-y-4 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm text-slate-400">输入素材</h4>
             <select value={selectedNovelId} onChange={(e) => setSelectedNovelId(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg">
                <option value="">-- 选择小说 --</option>
                {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
             </select>
             <select value={selectedOutlineId} onChange={(e) => setSelectedOutlineId(e.target.value)} className="w-full text-sm border-emerald-300 rounded-lg">
                <option value="">-- 选择大纲 --</option>
                {outlines.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
             </select>
