import React, { useState, useEffect } from 'react';
import { ScrollText, Save, Download, Wand2, Zap, Feather, AlertCircle, PenTool } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, GlobalContextHandler, ModelTier } from '../types';
import { analyzeAdaptationFocus, generateFullScriptOutline } from '../services/geminiService';

interface SeasonPlannerProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void;
}

const FullOutlineGenerator: React.FC<SeasonPlannerProps> = ({ files = [], addGeneratedFile, registerContext }) => {
  // 1. 关联知识库：过滤出“原著小说”和“文笔参考”两类文件
  const novels = files.filter(f => f.type === FileType.NOVEL);
  const styleRefs = files.filter(f => f.type === FileType.STYLE_REF); // 对应知识库里的文笔参考类别

  // 状态管理
  const [selectedNovelId, setSelectedNovelId] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(''); // 记录选中的文笔参考ID
  const [episodeCount, setEpisodeCount] = useState('80');
  const [focusInstructions, setFocusInstructions] = useState('');
  const [mode, setMode] = useState<FrequencyMode>(FrequencyMode.MALE);
  const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.CREATIVE_PRO); 

  const [generatedOutline, setGeneratedOutline] = useState(''); 
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isAnalyzingFocus, setIsAnalyzingFocus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentBookName = novels.find(n => n.id === selectedNovelId)?.name || '未命名作品';

  useEffect(() => {
    registerContext({
        name: `剧本脱水大纲 (${currentBookName})`,
        getValue: () => generatedOutline,
        setValue: (newVal) => setGeneratedOutline(newVal)
    });
  }, [generatedOutline, currentBookName, registerContext]);

  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) {
      setSelectedNovelId(novels[0].id);
    }
  }, [novels, selectedNovelId]);

  // 生成逻辑：提取文笔参考内容并传给 AI
  const handleGenerateOutline = async () => {
    if (!selectedNovelId) {
      setErrorMsg("请先选择一本原著小说");
      return;
    }
    
    setIsGeneratingOutline(true);
    setErrorMsg(null);
    
    const novel = files.find(f => f.id === selectedNovelId);
    // 获取选中的文笔参考文件的具体内容
    const styleRefFile = styleRefs.find(f => f.id === selectedStyleId);

    try {
      const outline = await generateFullScriptOutline(
        novel?.content || "",
        episodeCount,
        focusInstructions,
        mode,
        modelTier,
        styleRefFile?.content || "" // 将文笔参考内容传给后端服务
      );
      setGeneratedOutline(outline);
    } catch (err) {
      setErrorMsg("全书大纲生成失败，请检查 API 余额或网络。");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleAnalyzeFocus = async () => {
    if (!selectedNovelId) {
        setErrorMsg("请先选择一本原著小说");
        return;
    }
    setIsAnalyzingFocus(true);
    const novel = files.find(f => f.id === selectedNovelId);
    try {
        const suggestion = await analyzeAdaptationFocus(novel?.content || "", mode);
        setFocusInstructions(suggestion);
    } catch (err) {
        setErrorMsg("分析失败");
    } finally {
        setIsAnalyzingFocus(false);
    }
  };

  const handleSave = () => {
    if (!generatedOutline) return;
    setIsSaving(true);
    addGeneratedFile(`${currentBookName}-脱水大纲`, generatedOutline, FileType.SEASON_OUTLINE);
    setTimeout(() => {
        setIsSaving(false);
        alert(`已保存至知识库！`);
    }, 500);
  };

  const handleDownload = () => {
    if (!generatedOutline) return;
    const blob = new Blob([generatedOutline], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBookName}_全书大纲.doc`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (files.length === 0) {
    return <div className="p-20 text-center text-slate-500">素材库为空，请先在知识库上传小说。</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* 左侧控制栏 */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 sticky top-24 overflow-y-auto max-h-[85vh]">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-700">
             <ScrollText size={24} />
             <h3 className="font-bold text-lg">全书剧本大纲生成</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">1. 选择原著小说</label>
            <select value={selectedNovelId} onChange={(e) => setSelectedNovelId(e.target.value)} className="w-full border-slate-300 rounded-lg py-2.5">
              <option value="">-- 请选择 --</option>
              {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          {/* 💡 找回来的核心功能：文笔参考选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <PenTool size={14} className="text-emerald-600"/> 2. 文笔参考 (可选)
            </label>
            <select 
              value={selectedStyleId} 
              onChange={(e) => setSelectedStyleId(e.target.value)} 
              className="w-full border-emerald-300 rounded-lg py-2.5 bg-emerald-50/30 text-sm"
            >
              <option value="">-- 不使用参考 (系统默认) --</option>
              {styleRefs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              * 关联知识库中的【文笔参考】类别。AI 将模仿该文档的叙事风格、段落节奏及脱水颗粒度。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">3. 目标受众模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMode(FrequencyMode.MALE)} className={`py-2.5 rounded-lg text-sm font-medium border ${mode === FrequencyMode.MALE ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>♂ 男频爽剧</button>
              <button onClick={() => setMode(FrequencyMode.FEMALE)} className={`py-2.5 rounded-lg text-sm font-medium border ${mode === FrequencyMode.FEMALE ? 'bg-pink-600 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>♀ 女频情感</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">4. 预计总体量 (集数)</label>
            <div className="relative">
                <input 
                    type="number" 
                    value={episodeCount} 
                    onChange={(e) => setEpisodeCount(e.target.value)}
                    className="w-full border-slate-300 rounded-lg py-2.5 pr-10 focus:ring-emerald-500 focus:border-emerald-500" 
                    placeholder="例如：80"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">集</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">5. 核心脱水指令 (可选)</label>
                <button onClick={handleAnalyzeFocus} disabled={isAnalyzingFocus || !selectedNovelId} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50">
                    {isAnalyzingFocus ? "分析中..." : <><Wand2 size={12} className="inline mr-1"/> AI 智能分析</>}
                </button>
            </div>
            <textarea value={focusInstructions} onChange={(e) => setFocusInstructions(e.target.value)} className="w-full border-slate-300 rounded-lg min-h-[80px] text-sm" placeholder="例如：重点保留主角获得金手指的段落，删掉感情线..." />
          </div>

          <button onClick={handleGenerateOutline} disabled={isGeneratingOutline || !selectedNovelId} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold shadow-lg transition-all text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 mt-2">
             {isGeneratingOutline ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <ScrollText size={20} />}
             生成 2000-3000 字全书大纲
          </button>

          {errorMsg && <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>}
        </div>
      </div>

      {/* 右侧展示区保持不变 */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-[700px] flex flex-col">
           <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
             <div className="flex items-center gap-2">
                <ScrollText size={20} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-lg">全书脱水大纲 (2000-3000字)</h3>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
                    <Download size={14} />下载 DOC
                </button>
                <button onClick={handleSave} disabled={isSaving || !generatedOutline} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-black hover:scale-105 transition-all">
                    <Save size={14} />保存至知识库
                </button>
             </div>
           </div>
           
           <div className="flex-1 p-0 relative">
             <textarea
                className="w-full h-full p-10 resize-none focus:outline-none font-sans text-base leading-relaxed text-slate-700 bg-slate-50/20"
                value={generatedOutline}
                onChange={(e) => setGeneratedOutline(e.target.value)}
                placeholder="点击左侧按钮，AI 将开始通读原著并生成高保真脱水大纲..."
             />
             {isGeneratingOutline && (
                <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center backdrop-blur-[1px]">
                    <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
                    <p className="text-emerald-700 font-medium">正在解析原著并参考指定文笔风格...</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FullOutlineGenerator;
