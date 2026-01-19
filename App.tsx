import React, { useState } from 'react';
import Layout from './components/Layout';
import KnowledgeBase from './components/KnowledgeBase';
import WorkflowSelection from './components/WorkflowSelection';
import ScriptGenerator from './components/ScriptGenerator';
import OutlineGenerator from './components/OutlineGenerator';
import SeasonPlanner from './components/SeasonPlanner';
import { AppStep, KnowledgeFile, FileType, GlobalContextHandler, AgentController } from './types';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.KNOWLEDGE_BASE);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  
  // State to hold the active editor context for the Global Chat
  const [activeContext, setActiveContext] = useState<GlobalContextHandler | null>(null);

  const handleAddGeneratedFile = (name: string, content: string, type: FileType) => {
    const newFile: KnowledgeFile = {
      id: crypto.randomUUID(),
      name: name,
      type: type,
      content: content,
      uploadDate: Date.now()
    };
    setFiles(prev => [...prev, newFile]);
  };

  // Define the agent controller to expose app navigation
  const agentController: AgentController = {
    navigateTo: (step: AppStep) => {
      // Logic to safely navigate (e.g., handling context clearing)
      if (step !== currentStep) {
        setActiveContext(null); // Clear context when switching views via agent
        setCurrentStep(step);
      }
    },
    currentStep: currentStep
  };

  const renderContent = () => {
    switch (currentStep) {
      case AppStep.KNOWLEDGE_BASE:
        return (
          <KnowledgeBase
            files={files}
            setFiles={setFiles}
            onNext={() => setCurrentStep(AppStep.WORKFLOW_SELECT)}
          />
        );
      case AppStep.WORKFLOW_SELECT:
        return (
          <WorkflowSelection
            onSelect={(step) => setCurrentStep(step)}
          />
        );
      case AppStep.SEASON_PLANNER:
        return (
          <SeasonPlanner
             files={files}
             addGeneratedFile={handleAddGeneratedFile}
             registerContext={(handler) => setActiveContext(handler)}
          />
        );
      case AppStep.SCRIPT_GENERATOR:
        return (
          <ScriptGenerator 
            files={files} 
            addGeneratedFile={handleAddGeneratedFile}
            registerContext={(handler) => setActiveContext(handler)}
          />
        );
      case AppStep.OUTLINE_GENERATOR:
        return (
          <OutlineGenerator 
            files={files} 
            addGeneratedFile={handleAddGeneratedFile}
          />
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (currentStep) {
      case AppStep.KNOWLEDGE_BASE: return '第一阶段：知识库构建';
      case AppStep.WORKFLOW_SELECT: return '第二阶段：选择工作流';
      case AppStep.SEASON_PLANNER: return '核心工作台：季度改编规划';
      case AppStep.SCRIPT_GENERATOR: return '核心工作台：剧情脚本生成';
      case AppStep.OUTLINE_GENERATOR: return '辅助工具：人物大纲提取';
      default: return '';
    }
  };

  const handleBack = () => {
    if (currentStep === AppStep.KNOWLEDGE_BASE) return;
    // Clear context when leaving editor pages
    setActiveContext(null);
    if (currentStep === AppStep.WORKFLOW_SELECT) setCurrentStep(AppStep.KNOWLEDGE_BASE);
    else setCurrentStep(AppStep.WORKFLOW_SELECT);
  };

  return (
    <Layout 
      title={getTitle()} 
      onBack={currentStep !== AppStep.KNOWLEDGE_BASE ? handleBack : undefined}
      contextHandler={activeContext}
      agentController={agentController}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;