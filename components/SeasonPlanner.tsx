import React, { useState, useEffect } from 'react';
import { ScrollText, Save, BookOpen, AlertCircle, Download, Wand2, FileText, Zap, Feather } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, GlobalContextHandler, ModelTier } from '../types';
import { analyzeAdaptationFocus } from '../services/geminiService';
// 💡 注意：这里调用的是我们将要在 geminiService 中更新的新函数名
import { generateFullScriptOutline, generatePlotSummary } from '../services/geminiService';

interface SeasonPlannerProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void;
}

type TabMode = 'OUTLINE' | 'SYNOPSIS';

const FullOutlineGenerator: React.FC<SeasonPlannerProps> = ({ files = [], addGeneratedFile, registerContext }) => {
  // 1. 增加这一段保护逻辑
  if (!files || files.length === 0) {
    return <div className="p-20 text-center text-slate-500">素材库为空，请先上传小说原著。</div>;
  }

  const novels = files.filter(f => f.type === FileType.NOVEL);
  const styleRefs = files.filter(f => f.type === FileType.STYLE_REF); 

  // 2. 修改这一行，初始值给空字符串
  const [selectedNovelId, setSelectedNovelId] = useState<string>('');
  const [selectedNovelId, setSelectedNovelId] = useState<string>(novels[0]?.id || '');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(''); 
  
  const [episodeCount, setEpisodeCount] = useState('60-100');
  const [focusInstructions, setFocusInstructions] = useState('');
  const [mode, setMode] = useState<FrequencyMode>(FrequencyMode.MALE);
  const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.CREATIVE_PRO); 
  
  const [activeTab, setActiveTab] = useState<TabMode>('OUTLINE');

  const [generatedOutline, setGeneratedOutline] = useState(''); 
  const [generatedSynopsis, setGeneratedSynopsis] = useState(''); 

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);
  const [isAnalyzingFocus, setIsAnalyzingFocus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 获取当前项目标题（书名）
  const currentBookName = novels.find(n => n.id === selectedNovelId)?.name || '未命名作品';

  useEffect(() => {
    if (activeTab === 'OUTLINE') {
        registerContext({
            name: `剧本脱水大纲 (${currentBookName})`,
            getValue: () => generatedOutline,
            setValue: (newVal) => setGeneratedOutline(newVal)
        });
    } else {
        registerContext({
            name: `商业剧情梗概 (${currentBookName})`,
            getValue: () => generatedSynopsis,
            setValue: (newVal) => setGeneratedSynopsis(newVal)
        });
    }
  }, [activeTab, generatedOutline, generatedSynopsis, currentBookName, registerContext]);

  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) {
      setSelectedNovelId(novels[0].id);
    }
  }, [novels]);

  // 💡 步骤1：生成 2000-3000 字全书脱水大纲
  const handleGenerateOutline = async () => {
    if (!selectedNovelId) {
      setErrorMsg("请先选择一本原著小说");
      return;
    }
    
    setIsGeneratingOutline(true);
    setErrorMsg(null);
    setActiveTab('OUTLINE');
    
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

  // 💡 步骤2：生成商业梗概
  const handleGenerateSynopsis = async () => {
    if (!generatedOutline) {
        setErrorMsg("请先生成【脱水大纲】(步骤1)，再生成商业梗概。");
        setActiveTab('OUTLINE');
        return;
    }

    setIsGeneratingSynopsis(true);
    setErrorMsg(null);
    setActiveTab('SYNOPSIS');

    const novel = files.find(f => f.id === selectedNovelId);
    const style = files.find(f => f.id === selectedStyleId);

    try {
        const summary = await generatePlotSummary(
            generatedOutline, 
            style?.content || "",
            novel?.content,
            mode // 💡 传入模式以匹配爽点
        );
        setGeneratedSynopsis(summary);
    } catch (err) {
        setErrorMsg("剧情梗概生成失败，请重试。");
    } finally {
        setIsGeneratingSynopsis(false);
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
    const contentToSave = activeTab === 'OUTLINE' ? generatedOutline : generatedSynopsis;
    const type = FileType.SEASON_OUTLINE; // 保持类型兼容
    const suffix = activeTab === 'OUTLINE' ? '脱水大纲' : '商业梗概';
    if (!contentToSave) return;
    setIsSaving(true);
    addGeneratedFile(`${currentBookName}-${suffix}`, contentToSave, type);
    setTimeout(() => {
        setIsSaving(false);
        alert(`已保存至知识库！`);
    }, 500);
  };

  const handleDownload = () => {
    const content = activeTab === 'OUTLINE' ? generatedOutline : generatedSynopsis;
    const suffix = activeTab === 'OUTLINE' ? '大纲' : '梗概';
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBookName}_${suffix}.doc`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 sticky top-24">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-700">
             <ScrollText size={24} />
             <h3 className="font-bold text-lg">全书剧本大纲生成</h3>
          </div>

          {/* Model Switcher */}
          <div className="space-y-2 pb-4 border-b border-slate-100">
             <h4 className="font-semibold text-slate-800 text-sm">选择 AI 引擎</h4>
             <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setModelTier(ModelTier.CREATIVE_PRO)} className={`relative p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.CREATIVE_PRO ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold flex items-center gap-1 ${modelTier === ModelTier.CREATIVE_PRO ? 'text-indigo-700' : 'text-slate-600'}`}>
                           <Feather size={14} /> 沉浸文笔版
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">逻辑严密，适合生成 3000 字深度大纲。</p>
                </button>
                <button onClick={() => setModelTier(ModelTier.LOGIC_FAST)} className={`relative p-3 rounded-xl text-left border transition-all ${modelTier === ModelTier.LOGIC_FAST ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                         <span className={`text-sm font-bold flex items-center gap-1 ${modelTier === ModelTier.LOGIC_FAST ? 'text-emerald-700' : 'text-slate-600'}`}>
                           <Zap size={14} /> 极速逻辑版
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">处理速度快，适合快速脱水提取内容。</p>
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
            <select value={episodeCount} onChange={(e) => setEpisodeCount(e.target.value)} className="w-full border-slate-300 rounded-lg py-2.5">
                <option value="60">精品短剧 (60集)</option>
                <option value="100">标准长番 (100集)</option>
                <option value="150">大长篇 (150+集)</option>
            </select>
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

          <div className="pt-2">
             <button onClick={handleGenerateOutline} disabled={isGeneratingOutline || !selectedNovelId} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium shadow-md transition-all text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                {isGeneratingOutline ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <ScrollText size={18} />}
                步骤1：生成 3000 字脱水大纲
             </button>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                     <FileText size={14} className="text-emerald-600"/> 梗概写法参考 (必选)
                </label>
                <select value={selectedStyleId} onChange={(e) => setSelectedStyleId(e.target.value)} className="w-full border-emerald-300 rounded-lg py-2.5 bg-emerald-50/30">
                  <option value="">-- 请选择参考格式 --</option>
                  {styleRefs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
            </div>
            <button onClick={handleGenerateSynopsis} disabled={isGeneratingSynopsis || !generatedOutline || !selectedStyleId} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium shadow-md text-white bg-slate-900 hover:bg-black disabled:opacity-50">
                {isGeneratingSynopsis ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <BookOpen size={18} />}
                步骤2：生成商业剧情梗概
             </button>
          </div>

          {errorMsg && <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-[600px] flex flex-col">
           <div className="px-2 pt-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
             <button onClick={() => setActiveTab('OUTLINE')} className={`px-6 py-3 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-colors relative top-[1px] ${activeTab === 'OUTLINE' ? 'bg-white text-emerald-700 border border-slate-200 border-b-white z-10' : 'bg-transparent text-slate-500'}`}>
                <ScrollText size={16} /> 剧本脱水大纲 (3000字)
             </button>
             <button onClick={() => setActiveTab('SYNOPSIS')} className={`px-6 py-3 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-colors relative top-[1px] ${activeTab === 'SYNOPSIS' ? 'bg-white text-slate-900 border border-slate-200 border-b-white z-10' : 'bg-transparent text-slate-500'}`}>
                <FileText size={16} /> 商业剧情梗概
             </button>
           </div>

           <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center bg-white">
             <span className="text-xs text-slate-400">{activeTab === 'OUTLINE' ? '深度分析原著核心骨架' : '适配发行端的梗概预览'}</span>
             <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-slate-300 text-slate-600 hover:bg-slate-50"><Download size={14} />下载</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-slate-900 text-white hover:bg-black hover:scale-105 transition-all"><Save size={14} />保存</button>
             </div>
           </div>
           
           <div className="flex-1 p-0 relative">
             <textarea
                className="w-full h-full p-8 resize-none focus:outline-none font-mono text-sm leading-loose text-slate-700 bg-slate-50/30"
                value={activeTab === 'OUTLINE' ? generatedOutline : generatedSynopsis}
                onChange={(e) => activeTab === 'OUTLINE' ? setGeneratedOutline(e.target.value) : setGeneratedSynopsis(e.target.value)}
                placeholder="点击左侧按钮，AI 将开始通读原著并进行高保真脱水大纲提取..."
             />
             {((activeTab === 'OUTLINE' && !generatedOutline) || (activeTab === 'SYNOPSIS' && !generatedSynopsis)) && (
                <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-slate-400">请先点击左侧生成按钮</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FullOutlineGenerator;
