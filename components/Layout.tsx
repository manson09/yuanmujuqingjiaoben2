import React from 'react';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import GlobalChat from './GlobalChat';
import { GlobalContextHandler, AgentController } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  contextHandler?: GlobalContextHandler | null; // Pass context handler to layout
  agentController?: AgentController; // New prop
}

const Layout: React.FC<LayoutProps> = ({ children, title, onBack, contextHandler, agentController }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                aria-label="返回上一级"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              漫改智脑 <span className="text-slate-400 font-normal text-sm">| AniAdapt AI</span>
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            {title}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; 2025 漫改智脑系统 | 遵循原著至上原则
        </div>
      </footer>

      {/* Floating Chat */}
      <GlobalChat 
        contextHandler={contextHandler || null} 
        agentController={agentController}
      />
    </div>
  );
};

export default Layout;