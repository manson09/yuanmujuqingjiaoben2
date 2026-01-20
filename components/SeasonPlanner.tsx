import React, { useState, useEffect } from 'react';
import { ScrollText, Save, Download, Wand2, Zap, Feather, AlertCircle } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, GlobalContextHandler, ModelTier } from '../types';
import { analyzeAdaptationFocus, generateFullScriptOutline } from '../services/geminiService';

interface SeasonPlannerProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void;
}

const FullOutlineGenerator: React.FC<SeasonPlannerProps> = ({ files = [], addGeneratedFile, registerContext }) => {
  // 基础数据过滤
  const novels = files.filter(f => f.type === FileType.NOVEL);

  // 状态管理
  const [selectedNovelId, setSelectedNovelId] = useState<string>('');
  const [episodeCount, setEpisodeCount] = useState('80'); // 默认值
  const [focusInstructions, setFocusInstructions] = useState('');
  const [mode, setMode] = useState<FrequencyMode>(FrequencyMode.MALE);
  const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.CREATIVE_PRO); 

  const [generatedOutline, setGeneratedOutline] = useState(''); 
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isAnalyzingFocus, setIsAnalyzingFocus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 获取当前项目标题
  const currentBookName = novels.find(n => n.id === selectedNovelId)?.name || '未命名作品';

  // 注册全局上下文（用于其他智能体联动）
  useEffect(() => {
    registerContext({
        name: `剧本脱水大纲 (${currentBookName})`,
        getValue: () => generatedOutline,
        setValue: (newVal) => setGeneratedOutline(newVal)
    });
  }, [generatedOutline, currentBookName, registerContext]);

  // 自动选中第一本小说
  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) {
      setSelectedNovelId(novels[0].id);
    }
  }, [novels, selectedNovelId]);

  // 生成大纲函数
  const handleGenerateOutline = async () => {
    if (!selectedNovelId) {
      setErrorMsg("请先选择一本原著小说");
      return;
    }
    
    setIsGeneratingOutline(true);
    setErrorMsg(null);
    
    const novel = files.find(f => f.id === selectedNovelId);

    try {
      const outline = await generateFullScriptOutline(
        novel?.content || "",
        episodeCount,
        focusInstructions,
        mode,
        modelTier
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 sticky top-24">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-700">
             <ScrollText size={24} />
             <h3 className="font-bold text-lg">全书剧本大纲生成</h3>
          </div>

          {/* AI 引擎选择 */}
          <div className="space-y-2 pb-2">
             <h4 className="font-semibold text-slate-800 text-sm">选择 AI 引擎</h4>
             <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setModelTier(ModelTier.CREATIVE_PRO)} className={`p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.CREATIVE_PRO ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <span className={`text-sm font-bold flex items-center gap-1 ${modelTier === ModelTier.CREATIVE_PRO ? 'text-indigo-700' : 'text-slate-600'}`}>
                        <Feather size={14} /> 沉浸文笔版 (推荐)
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">深度理解长文本，适合生成 2000字+ 大纲。</p>
                </button>
                <button onClick={() => setModelTier(ModelTier.LOGIC_FAST)} className={`p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.LOGIC_FAST ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <span className={`text-sm font-bold flex items-center gap-1 ${modelTier === ModelTier.LOGIC_FAST ? 'text-emerald-700' : 'text-slate-600'}`}>
                        <Zap size={14} /> 极速提取版
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">处理极其迅速，适合快速梳理剧情骨架。</p>
                </button>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">1. 选择原著小说</label>
            <select value={selectedNovelId} onChange={(e) => setSelectedNovelId(e.target.value)} className="w-full border-slate-300 rounded-lg py-2.5">
              <option value="">-- 请选择 --</option>
              {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">2. 目标受众模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMode(FrequencyMode.MALE)} className={`py-2.5 rounded-lg text-sm font-medium border ${mode === FrequencyMode.MALE ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>♂ 男频爽剧</button>
              <button onClick={() => setMode(FrequencyMode.FEMALE)} className={`py-2.5 rounded-lg text-sm font-medium border ${mode === FrequencyMode.FEMALE ? 'bg-pink-600 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>♀ 女频情感</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">3. 预计总体量 (集数)</label>
            <div className="relative">
                <input 
                    type="number" 
                    value={episodeCount} 
                    onChange={(e) => setEpisodeCount(e.target.value)}
                    className="w-full border-slate-300 rounded-lg py-2.5 pr-10" 
                    placeholder="例如：80"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">集</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">4. 核心脱水指令 (可选)</label>
                <button onClick={handleAnalyzeFocus} disabled={isAnalyzingFocus || !selectedNovelId} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50">
                    {isAnalyzingFocus ? "分析中..." : <><Wand2 size={12} className="inline mr-1"/> AI 智能分析</>}
                </button>
            </div>
            <textarea value={focusInstructions} onChange={(e) => setFocusInstructions(e.target.value)} className="w-full border-slate-300 rounded-lg min-h-[80px] text-sm" placeholder="例如：重点保留主角获得金手指的段落，删掉感情线..." />
          </div>

          <button onClick={handleGenerateOutline} disabled={isGeneratingOutline || !selectedNovelId} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold shadow-lg transition-all text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 mt-4">
             {isGeneratingOutline ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <ScrollText size={20} />}
             生成 2000-3000 字全书大纲
          </button>

          {errorMsg && <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>}
        </div>
      </div>

      {/* 右侧主内容展示区 */}
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
                <button onClick={handleSave} disabled={isSaving || !generatedOutline} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-black hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100">
                    <Save size={14} />保存至知识库
                </button>
             </div>
           </div>
           
           <div className="flex-1 p-0 relative">
             <textarea
                className="w-full h-full p-10 resize-none focus:outline-none font-sans text-base leading-relaxed text-slate-700 bg-slate-50/20"
                value={generatedOutline}
                onChange={(e) => setGeneratedOutline(e.target.value)}
                placeholder="点击左侧按钮，AI 将通读原著并开始生成高保真脱水大纲..."
             />
             {!generatedOutline && !isGeneratingOutline && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                    <ScrollText size={64} className="text-slate-200 mb-4" />
                    <p className="text-slate-400">等待 AI 生成剧情骨架</p>
                </div>
             )}
             {isGeneratingOutline && (
                <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center backdrop-blur-[1px]">
                    <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
                    <p className="text-emerald-700 font-medium">正在深度阅读并解析原著中，请稍候...</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FullOutlineGenerator;
