import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Download, Sparkles, AlertCircle, Map, Users, Zap, Feather } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, ScriptSegment, GlobalContextHandler, ModelTier } from '../types';
import { generateScriptSegment } from '../services/geminiService';

interface ScriptGeneratorProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void;
  // 💡 持久化 Props
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

  // 初始选择逻辑
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
    
    // 💡 逻辑修正：计算当前任务的标签，但先不更新 episodeStart 全局状态
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
      // 💡 新生成逻辑：基于当前的 episodeStart 计算，但还没正式“确认”
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

      // --- ✅ API 调用成功后的处理 ---
      setSegments(prev => prev.map(s => 
        s.id === targetSegmentId 
          ? { ...s, content: result.content, summary: result.summary, isLoading: false } 
          : s
      ));

      addGeneratedFile(`脚本-${novel?.name}-${rangeLabel}`, result.content, FileType.GENERATED_SCRIPT);

      // 💡 关键修正：只有成功生成了“新”段落，才允许推进集数
      if (!regenerateId) {
          setEpisodeStart(prev => prev + 3);
      }

    } catch (err) {
      setErrorMsg("生成失败，进度已保留，请重试。");
      // 💡 失败处理：如果是新任务，移除那个转圈的占位符，集数保持不变
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

  // 每次内容变动，自动向父组件注册当前最活跃的编辑区域
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
      {/* Sidebar - 保持不变 */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 sticky top-24">
          <div className="space-y-2 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm">选择 AI 引擎</h4>
             <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setModelTier(ModelTier.CREATIVE_PRO)} className={`p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.CREATIVE_PRO ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <span className={`text-sm font-bold flex items-center gap-1 ${modelTier === ModelTier.CREATIVE_PRO ? 'text-indigo-700' : 'text-slate-600'}`}>
                        <Feather size={14} /> 沉浸文笔版
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">文笔细腻，适合精修剧本。</p>
                </button>
                <button onClick={() => setModelTier(ModelTier.LOGIC_FAST)} className={`p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.LOGIC_FAST ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <span className={`text-sm font-bold flex items-center gap-1 ${modelTier === ModelTier.LOGIC_FAST ? 'text-emerald-700' : 'text-slate-600'}`}>
                        <Zap size={14} /> 极速逻辑版
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">逻辑性强，适合快速梳理剧情。</p>
                </button>
             </div>
          </div>

          <div className="space-y-4 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm">输入素材</h4>
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">1. 原著小说 (核心)</label>
                <select value={selectedNovelId} onChange={(e) => setSelectedNovelId(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg">
                <option value="">-- 请选择 --</option>
                {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1">2. 季度大纲 (节奏)</label>
                <select value={selectedOutlineId} onChange={(e) => setSelectedOutlineId(e.target.value)} className="w-full text-sm border-emerald-300 rounded-lg bg-emerald-50/30">
                <option value="">-- 无 --</option>
                {outlines.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-orange-600 mb-1">3. 人设圣经 (一致性)</label>
                <select value={selectedBibleId} onChange={(e) => setSelectedBibleId(e.target.value)} className="w-full text-sm border-orange-300 rounded-lg bg-orange-50/30">
                <option value="">-- 无 --</option>
                {characterBibles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>
          </div>

          <div className="space-y-4 pb-4 border-b border-slate-100 text-sm">
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode(FrequencyMode.MALE)} className={`py-2 rounded-lg font-medium border ${mode === FrequencyMode.MALE ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>男频</button>
                <button onClick={() => setMode(FrequencyMode.FEMALE)} className={`py-2 rounded-lg font-medium border ${mode === FrequencyMode.FEMALE ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-600 border-slate-200'}`}>女频</button>
             </div>
          </div>

          <div className="pt-2">
             <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium text-slate-600">下一组:</span>
                <span className="text-sm font-bold text-indigo-600">{episodeStart}-{episodeStart + 2} 集</span>
             </div>
             <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !selectedNovelId}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold shadow-md transition-all text-white bg-slate-900 hover:bg-black disabled:opacity-50"
             >
                {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={18} />}
                {isGenerating ? "正在创作..." : "开始生成"}
