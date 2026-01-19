import React, { useState } from 'react';
import { Project, FrequencyMode } from '../types';

interface ProjectHubProps {
  projects: Project[];
  onSelect: (p: Project) => void;
  onCreate: (title: string, mode: FrequencyMode) => void;
  onDelete: (id: string) => void;
}

const ProjectHub: React.FC<ProjectHubProps> = ({ projects, onSelect, onCreate, onDelete }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMode, setNewMode] = useState<FrequencyMode>(FrequencyMode.MALE);

  return (
    <div className="p-10 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">作品管理中心</h2>
          <p className="text-slate-400 font-medium mt-2">管理您的多本小说改编进度</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all active:scale-95"
        >
          + 新建改编项目
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <div key={project.id} className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 relative">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${project.frequencyMode === FrequencyMode.MALE ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                {project.frequencyMode === FrequencyMode.MALE ? '男频模式' : '女频模式'}
              </span>
              <button onClick={() => onDelete(project.id)} className="text-slate-200 hover:text-rose-500 transition-colors">删除</button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-2 line-clamp-1">{project.title}</h3>
            <p className="text-xs text-slate-400 font-bold mb-8">
              上次编辑: {new Date(project.lastModified).toLocaleString()}
            </p>

            <button 
              onClick={() => onSelect(project)}
              className="w-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white text-slate-600 py-4 rounded-2xl font-black transition-all"
            >
              继续改编
            </button>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-32 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
            <p className="text-xl font-bold">暂无存档项目，点击右上角开始吧</p>
          </div>
        )}
      </div>

      {/* 新建项目弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-fade-up">
            <h3 className="text-2xl font-black mb-6">开启新改编</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">小说名称</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold outline-blue-500"
                  placeholder="请输入书名..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setNewMode(FrequencyMode.MALE)}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all ${newMode === FrequencyMode.MALE ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                >男频</button>
                <button 
                  onClick={() => setNewMode(FrequencyMode.FEMALE)}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all ${newMode === FrequencyMode.FEMALE ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                >女频</button>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowCreate(false)} className="flex-1 font-bold text-slate-400">取消</button>
                <button 
                  onClick={() => {
                    if(newTitle) { onCreate(newTitle, newMode); setShowCreate(false); }
                  }}
                  className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg"
                >开始创作</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHub;
