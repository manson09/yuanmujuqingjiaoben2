import React from 'react';
import { Clapperboard, Users, Map } from 'lucide-react';
import { AppStep } from '../types';

interface WorkflowSelectionProps {
  onSelect: (step: AppStep) => void;
}

const WorkflowSelection: React.FC<WorkflowSelectionProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-4">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-3xl font-bold text-slate-900">选择作业模式</h2>
        <p className="text-slate-500">智能体已准备就绪，请选择下一步工作任务</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Season Planner Card (New) */}
        <button
          onClick={() => onSelect(AppStep.SEASON_PLANNER)}
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Map size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">1. 季度改编规划</h3>
          <p className="text-slate-500 text-center text-sm leading-relaxed mb-4">
            【宏观蓝图】分析长篇小说，按季度（如60-100集）生成剧情大纲、节奏节点与人物成长线。
          </p>
          <span className="mt-auto px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            进入规划工作台
          </span>
        </button>

        {/* Script Generation Card */}
        <button
          onClick={() => onSelect(AppStep.SCRIPT_GENERATOR)}
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all duration-300 text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Clapperboard size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">2. 剧情脚本生成</h3>
          <p className="text-slate-500 text-center text-sm leading-relaxed mb-4">
            【具体施工】结合“原著”与“季度大纲”，编写具体集数的动漫分镜脚本。支持三集连写与智能续写。
          </p>
          <span className="mt-auto px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            进入创作工作台
          </span>
        </button>

        {/* Outline Extraction Card */}
        <button
          onClick={() => onSelect(AppStep.OUTLINE_GENERATOR)}
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-pink-500 hover:shadow-xl transition-all duration-300 text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-pink-50 text-pink-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Users size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">3. 人物资料提取</h3>
          <p className="text-slate-500 text-center text-sm leading-relaxed mb-4">
            【资料整理】分析已有脚本或大纲，自动提取人物资料卡（性格、关系、造型），生成标准化文档。
          </p>
          <span className="mt-auto px-4 py-2 bg-pink-50 text-pink-700 text-xs font-medium rounded-lg group-hover:bg-pink-600 group-hover:text-white transition-colors">
            进入分析工作台
          </span>
        </button>
      </div>
    </div>
  );
};

export default WorkflowSelection;