import React, { useState } from 'react';
import { UserCircle, Download, AlertCircle, Save } from 'lucide-react';
import { KnowledgeFile, FileType, CharacterProfile } from '../types';
import { extractCharacterOutline } from '../services/geminiService';

interface OutlineGeneratorProps {
  files: KnowledgeFile[];
  addGeneratedFile?: (name: string, content: string, type: FileType) => void; // Make optional to maintain compatibility if not passed
}

// In previous App.tsx, we didn't pass addGeneratedFile to OutlineGenerator, we need to update App.tsx to pass it
// But for now, let's assume it might be passed. To properly fix this, we should update App.tsx as well.

const OutlineGenerator: React.FC<OutlineGeneratorProps> = ({ files, addGeneratedFile }) => {
  // Files suitable for character analysis (Script, Novel)
  const targetFiles = files.filter(f => 
    f.type === FileType.GENERATED_SCRIPT || 
    f.type === FileType.NOVEL ||
    f.type === FileType.SEASON_OUTLINE
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!selectedTargetId) return;
    
    setIsAnalyzing(true);
    setErrorMsg(null);
    const targetFile = files.find(f => f.id === selectedTargetId);
    
    if (!targetFile) return;

    try {
      setProfiles([]);
      const results = await extractCharacterOutline(targetFile.content);
      setProfiles(results);
    } catch (err) {
      setErrorMsg("生成失败，请稍后重试。可能是内容过长或网络问题。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFormattedContent = () => {
      return profiles.map(p => 
`【姓名】：${p.name}
【性别/年龄】：${p.gender} / ${p.age}
【性格】：${p.personality}
【外貌】：${p.appearance}
【人物关系】：${p.relation}
---`).join('\n');
  };

  const handleSaveToKB = () => {
      if (!addGeneratedFile || profiles.length === 0) return;
      
      setIsSaving(true);
      const content = getFormattedContent();
      const targetFile = files.find(f => f.id === selectedTargetId);
      const name = `人设圣经-${targetFile?.name || '未知来源'}`;
      
      addGeneratedFile(name, content, FileType.CHARACTER_BIBLE);
      
      setTimeout(() => {
          setIsSaving(false);
          alert("已保存到知识库！现在您可以在[剧情脚本生成]中选用此文件，以保持人设一致性。");
      }, 500);
  };

  const downloadProfiles = () => {
    if (profiles.length === 0) return;
    const htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { text-align: center; }
        </style>
      </head>
      <body>
        <h1>人物大纲表</h1>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>年龄</th>
              <th>人物关系</th>
              <th>性格特征</th>
              <th>形象描述</th>
              <th>登场章节</th>
            </tr>
          </thead>
          <tbody>
            ${profiles.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.gender}</td>
                <td>${p.age}</td>
                <td>${p.relation}</td>
                <td>${p.personality}</td>
                <td>${p.appearance}</td>
                <td>${p.appearanceChapter}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadFile(htmlContent, `人物大纲_${Date.now()}.doc`, 'text/html;charset=utf-8');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">人物资料提取工作台</h2>
            <div className="text-sm text-slate-500">
                自动从剧本或小说中提取登场人物卡片
            </div>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择分析对象 (建议选择已生成的剧本)
                </label>
                <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3"
                >
                <option value="">-- 请选择目标文件 --</option>
                {targetFiles.map(f => (
                    <option key={f.id} value={f.id}>[{f.type}] {f.name}</option>
                ))}
                </select>
            </div>

            <div className="pt-2">
                <button
                    onClick={handleExecute}
                    disabled={!selectedTargetId || isAnalyzing}
                    className={`w-full py-3 rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-indigo-600 hover:bg-indigo-700`}
                >
                    {isAnalyzing ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <><UserCircle size={20} /> 开始拆解人物</>
                    )}
                </button>
            </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Character Results */}
      {profiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700">分析结果 ({profiles.length} 位角色)</h3>
             <div className="flex gap-2">
                 {addGeneratedFile && (
                    <button
                        onClick={handleSaveToKB}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors shadow-sm"
                    >
                        <Save size={16} /> 保存为【人设圣经】
                    </button>
                 )}
                 <button
                    onClick={downloadProfiles}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                 >
                    <Download size={16} /> 下载 Word 表格
                 </button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">姓名/性别/年龄</th>
                  <th className="px-6 py-3">人物关系</th>
                  <th className="px-6 py-3">性格特征</th>
                  <th className="px-6 py-3">形象描述</th>
                  <th className="px-6 py-3 w-24">登场章节</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-full">
                           <UserCircle size={24} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.gender} | {p.age}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">{p.relation}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">
                       <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{p.personality}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs">{p.appearance}</td>
                    <td className="px-6 py-4 text-sm font-mono text-indigo-600">{p.appearanceChapter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineGenerator;