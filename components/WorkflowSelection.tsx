import React from 'react';
import { Clapperboard, Users, ScrollText } from 'lucide-react';
import { AppStep } from '../types';

interface WorkflowSelectionProps {
  onSelect: (step: AppStep) => void;
}

const WorkflowSelection: React.FC<WorkflowSelectionProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-4">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-3xl font-bold text-slate-900">选择作业模式</h2>
        <p className="text-slate-500">已开启【高保真脱水适配】模式，请选择当前任务</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* 💡 修改：由季度规划改为 全书大纲生成 */}
        <button
          onClick={() => onSelect(AppStep.SCRIPT_OUTLINE_GEN)}
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <ScrollText size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">1. 全书剧本大纲生成</h3>
          <p className="text-slate-500 text-center text-sm leading-relaxed mb-4">
            【高保真脱水】通读原著小说，生成 2000-3000 字完整大纲。严格保留所有人物、核心台词及关键道具，仅压缩冗余水分。
          </p>
          <span className="mt-auto px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            进入大纲工作台
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
          <h3 className="text-lg font-bold text-slate-900 mb-2">2. 剧情脚本精修</h3>
          <p className="text-slate-500 text-center text-sm leading-relaxed mb-4">
            【内容高保真】直接对原著小说进行水分压缩改写。保持角色语气、关键物品与名场面 100% 还原，实现影视化节奏适配。
          </p>
          <span className="mt-auto px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            进入创作工作台
          </span>
        </button>

        {/* 💡 修改：人设提取更名 */}
        <button
          onClick={() => onSelect(AppStep.CHARACTER_EXTRACTOR)}
          className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-pink-500 hover:shadow-xl transition-all duration-300 text-left h-full"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-pink-50 text-pink-600 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Users size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">3. 角色与道具提取</h3>
          <p className="text-slate-500 text-center text-sm leading-relaxed mb-4">
            【元素完整性】从原著或脚本中自动提取人物性格、关系链以及关键法宝/道具清单，确保改编过程零遗漏。
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
