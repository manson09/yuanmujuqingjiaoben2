import React, { useState, useEffect } from 'react';
import { Map, Save, Sparkles, BookOpen, AlertCircle, Download, Wand2, FileText, LayoutTemplate } from 'lucide-react';
import { KnowledgeFile, FileType, FrequencyMode, GlobalContextHandler } from '../types';
import { generateSeasonPlan, analyzeAdaptationFocus, generatePlotSummary } from '../services/geminiService';

interface SeasonPlannerProps {
  files: KnowledgeFile[];
  addGeneratedFile: (name: string, content: string, type: FileType) => void;
  registerContext: (handler: GlobalContextHandler) => void; // Prop for context registration
}

type TabMode = 'STRUCTURE' | 'SYNOPSIS';

const SeasonPlanner: React.FC<SeasonPlannerProps> = ({ files, addGeneratedFile, registerContext }) => {
  const novels = files.filter(f => f.type === FileType.NOVEL);
  const styleRefs = files.filter(f => f.type === FileType.STYLE_REF); 

  const [selectedNovelId, setSelectedNovelId] = useState<string>(novels[0]?.id || '');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(''); 
  
  const [seasonName, setSeasonName] = useState('第一季：初入江湖');
  const [episodeCount, setEpisodeCount] = useState('60-100');
  const [focusInstructions, setFocusInstructions] = useState('');
  const [mode, setMode] = useState<FrequencyMode>(FrequencyMode.MALE);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<TabMode>('STRUCTURE');

  // Content States
  const [generatedPlan, setGeneratedPlan] = useState(''); 
  const [generatedSynopsis, setGeneratedSynopsis] = useState(''); 

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);
  const [isAnalyzingFocus, setIsAnalyzingFocus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register context whenever content or tab changes
  useEffect(() => {
    if (activeTab === 'STRUCTURE') {
        registerContext({
            name: `季度结构规划 (${seasonName})`,
            getValue: () => generatedPlan,
            setValue: (newVal) => setGeneratedPlan(newVal)
        });
    } else {
        registerContext({
            name: `剧情大纲 (${seasonName})`,
            getValue: () => generatedSynopsis,
            setValue: (newVal) => setGeneratedSynopsis(newVal)
        });
    }
  }, [activeTab, generatedPlan, generatedSynopsis, seasonName, registerContext]);

  // Auto-select first novel
  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) {
      setSelectedNovelId(novels[0].id);
    }
  }, [novels]);

  // Step 1: Generate Structural Plan
  const handleGeneratePlan = async () => {
    if (!selectedNovelId) {
      setErrorMsg("请先选择一本原著小说");
      return;
    }
    
    setIsGeneratingPlan(true);
    setErrorMsg(null);
    setActiveTab('STRUCTURE');
    
    const novel = files.find(f => f.id === selectedNovelId);

    try {
      const plan = await generateSeasonPlan(
        novel?.content || "",
        seasonName,
        episodeCount,
        focusInstructions,
        mode
      );
      setGeneratedPlan(plan);
    } catch (err) {
      setErrorMsg("结构规划生成失败，请重试。");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Step 2: Generate Synopsis (Commercial Plot Summary)
  const handleGenerateSynopsis = async () => {
    if (!generatedPlan) {
        setErrorMsg("请先生成【结构规划】(步骤1)，再生成剧情梗概。");
        setActiveTab('STRUCTURE');
        return;
    }

    if (!selectedNovelId) return;

    setIsGeneratingSynopsis(true);
    setErrorMsg(null);
    setActiveTab('SYNOPSIS');

    const novel = files.find(f => f.id === selectedNovelId);
    const style = files.find(f => f.id === selectedStyleId);

    try {
        const summary = await generatePlotSummary(
            generatedPlan, 
            style?.content || "",
            novel?.content
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
        setErrorMsg("请先选择一本原著小说，AI 才能进行分析。");
        return;
    }
    
    setIsAnalyzingFocus(true);
    const novel = files.find(f => f.id === selectedNovelId);
    
    try {
        const suggestion = await analyzeAdaptationFocus(novel?.content || "", mode);
        setFocusInstructions(suggestion);
    } catch (err) {
        setErrorMsg("分析失败，请稍后重试");
    } finally {
        setIsAnalyzingFocus(false);
    }
  };

  const handleSave = () => {
    const contentToSave = activeTab === 'STRUCTURE' ? generatedPlan : generatedSynopsis;
    const type = activeTab === 'STRUCTURE' ? FileType.SEASON_OUTLINE : FileType.SEASON_OUTLINE; 
    const suffix = activeTab === 'STRUCTURE' ? '结构规划' : '剧情梗概';
    
    if (!contentToSave) return;
    
    setIsSaving(true);
    addGeneratedFile(`${seasonName}-${suffix}`, contentToSave, type);
    
    setTimeout(() => {
        setIsSaving(false);
        alert(`${suffix}已保存至知识库！`);
    }, 500);
  };

  const handleDownload = () => {
    const contentToDownload = activeTab === 'STRUCTURE' ? generatedPlan : generatedSynopsis;
    const suffix = activeTab === 'STRUCTURE' ? '结构规划' : '剧情梗概';
    
    if (!contentToDownload) return;
    
    const blob = new Blob([contentToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${seasonName}_${suffix}.doc`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 sticky top-24">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-indigo-700">
             <Map size={24} />
             <h3 className="font-bold text-lg">季度改编规划</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">1. 选择原著小说</label>
            <select
              value={selectedNovelId}
              onChange={(e) => setSelectedNovelId(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
            >
              <option value="">-- 请选择 --</option>
              {novels.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">2. 目标频段 (爽点模型)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode(FrequencyMode.MALE)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                  mode === FrequencyMode.MALE 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ♂ 男频热血
              </button>
              <button
                onClick={() => setMode(FrequencyMode.FEMALE)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                  mode === FrequencyMode.FEMALE 
                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ♀ 女频情感
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">3. 季度名称</label>
                <input
                type="text"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="第一季"
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">预计集数</label>
                <select
                value={episodeCount}
                onChange={(e) => setEpisodeCount(e.target.value)}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                >
                <option value="12">季番 (12集)</option>
                <option value="24">半年番 (24集)</option>
                <option value="60-80">年番 (60+集)</option>
                </select>
              </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">4. 改编侧重 (AI指令)</label>
                <button 
                    onClick={handleAnalyzeFocus}
                    disabled={isAnalyzingFocus || !selectedNovelId}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                >
                    {isAnalyzingFocus ? "分析中..." : <><Wand2 size={12} /> AI 智能分析</>}
                </button>
            </div>
            <textarea
              value={focusInstructions}
              onChange={(e) => setFocusInstructions(e.target.value)}
              className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5 min-h-[80px] text-sm"
              placeholder="例如：加快前期节奏，前三集必须出现退婚高潮..."
            />
          </div>

          {/* Action Step 1: Generate Structure */}
          <div className="pt-2">
             <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || !selectedNovelId}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white bg-indigo-600 hover:bg-indigo-700`}
             >
                {isGeneratingPlan ? (
                   <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    步骤1：规划分集结构...
                   </>
                ) : (
                  <>
                    <Map size={18} />
                    步骤1：生成季度结构规划
                  </>
                )}
             </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-2"></div>

          {/* Action Step 2: Generate Synopsis */}
          <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                     <LayoutTemplate size={14} className="text-emerald-600"/> 剧情大纲写法参考 (必选)
                </label>
                <select
                value={selectedStyleId}
                onChange={(e) => setSelectedStyleId(e.target.value)}
                className="w-full border-emerald-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 py-2.5 bg-emerald-50/30"
                >
                <option value="">-- 请选择参考格式 --</option>
                {styleRefs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">请上传如《大纲范例》的文档供 AI 模仿格式</p>
            </div>

            <button
                onClick={handleGenerateSynopsis}
                disabled={isGeneratingSynopsis || !generatedPlan || !selectedStyleId}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white bg-emerald-600 hover:bg-emerald-700`}
             >
                {isGeneratingSynopsis ? (
                   <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    步骤2：撰写商业大纲...
                   </>
                ) : (
                  <>
                    <FileText size={18} />
                    步骤2：生成剧情梗概 (商业版)
                  </>
                )}
             </button>
             <p className="text-[10px] text-center text-slate-400">
                需先完成步骤 1 且选择写法参考
             </p>
          </div>

             {errorMsg && (
               <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded flex items-center gap-2">
                 <AlertCircle size={14} /> {errorMsg}
               </div>
             )}
        </div>
      </div>

      {/* Main Content Area - Tabs */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-[600px] flex flex-col">
           {/* Tabs Header */}
           <div className="px-2 pt-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
             <button
                onClick={() => setActiveTab('STRUCTURE')}
                className={`px-6 py-3 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-colors relative top-[1px] ${
                    activeTab === 'STRUCTURE' 
                    ? 'bg-white text-indigo-700 border border-slate-200 border-b-white z-10' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100'
                }`}
             >
                <Map size={16} /> 结构规划 (分集表)
             </button>
             <button
                onClick={() => setActiveTab('SYNOPSIS')}
                className={`px-6 py-3 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-colors relative top-[1px] ${
                    activeTab === 'SYNOPSIS' 
                    ? 'bg-white text-emerald-700 border border-slate-200 border-b-white z-10' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100'
                }`}
             >
                <FileText size={16} /> 剧情梗概 (商业版)
             </button>
           </div>

           {/* Toolbar */}
           <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center bg-white">
             <span className="text-xs text-slate-400">
                {activeTab === 'STRUCTURE' ? 'Markdown 格式预览' : '商业大纲纯文本预览'}
             </span>
             <div className="flex items-center gap-2">
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                    <Download size={14} />
                    下载
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-800"
                >
                    <Save size={14} />
                    {isSaving ? "..." : "保存"}
                </button>
             </div>
           </div>
           
           {/* Editor Area */}
           <div className="flex-1 p-0 relative">
             <textarea
                className="w-full h-full p-8 resize-none focus:outline-none font-mono text-sm leading-loose text-slate-700"
                value={activeTab === 'STRUCTURE' ? generatedPlan : generatedSynopsis}
                onChange={(e) => activeTab === 'STRUCTURE' ? setGeneratedPlan(e.target.value) : setGeneratedSynopsis(e.target.value)}
                placeholder={activeTab === 'STRUCTURE' ? "等待生成结构规划..." : "等待生成剧情梗概..."}
             />
             
             {/* Empty State Overlay */}
             {((activeTab === 'STRUCTURE' && !generatedPlan) || (activeTab === 'SYNOPSIS' && !generatedSynopsis)) && (
                <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-slate-400">请在左侧点击按钮生成内容</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonPlanner;
