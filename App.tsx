import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import KnowledgeBase from './components/KnowledgeBase';
import WorkflowSelection from './components/WorkflowSelection';
import ScriptGenerator from './components/ScriptGenerator';
import OutlineGenerator from './components/OutlineGenerator';
import SeasonPlanner from './components/SeasonPlanner';
import ProjectHub from './components/ProjectHub'; // 💡 待会需要新建这个组件
import { AppStep, KnowledgeFile, FileType, GlobalContextHandler, AgentController, Project, FrequencyMode } from './types';

const App: React.FC = () => {
 const [scriptDraft, setScriptDraft] = useState({
    content: '',      
    nextRange: '1-3' 
  });

  // ... 
  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setFiles(project.files);
    
    setScriptDraft({ content: '', nextRange: '1-3' });

    if (project.files.some(f => f.type === FileType.NOVEL)) {
      setCurrentStep(AppStep.WORKFLOW_SELECT);
    } else {
      setCurrentStep(AppStep.KNOWLEDGE_BASE);
    }
  };

  // ...

  const renderContent = () => {
    switch (currentStep) {
      // ... 
      case AppStep.SCRIPT_GENERATOR:
        return (
          <ScriptGenerator 
            files={files} 
            addGeneratedFile={handleAddGeneratedFile}
            registerContext={(handler) => setActiveContext(handler)}
            draft={scriptDraft}
            onDraftUpdate={(content, nextRange) => setScriptDraft({ content, nextRange })}
          />
        );
      // ...
    }
  };
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ani_adapt_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  // 初始步骤设为作品库
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.PROJECT_HUB);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [activeContext, setActiveContext] = useState<GlobalContextHandler | null>(null);

  // --- 💡 核心：自动持久化保存 ---
  useEffect(() => {
    localStorage.setItem('ani_adapt_projects', JSON.stringify(projects));
  }, [projects]);

  // 当文件列表变动时，实时同步到当前激活的项目中
  useEffect(() => {
    if (activeProject) {
      setProjects(prev => prev.map(p => 
        p.id === activeProject.id 
          ? { ...p, files: files, lastModified: Date.now() } 
          : p
      ));
    }
  }, [files]);

  // --- 💡 核心：项目操作函数 ---
  const handleCreateProject = (title: string, mode: FrequencyMode) => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      title,
      files: [],
      lastModified: Date.now(),
      frequencyMode: mode
    };
    setProjects([newProj, ...projects]);
    setActiveProject(newProj);
    setFiles([]); // 新项目文件为空
    setCurrentStep(AppStep.KNOWLEDGE_BASE);
  };

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setFiles(project.files); // 加载该项目的文件
    // 如果已经有小说了，直接去选择工作流，否则去上传
    if (project.files.some(f => f.type === FileType.NOVEL)) {
      setCurrentStep(AppStep.WORKFLOW_SELECT);
    } else {
      setCurrentStep(AppStep.KNOWLEDGE_BASE);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('确定要删除这个作品吗？所有进度将丢失。')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        setFiles([]);
        setCurrentStep(AppStep.PROJECT_HUB);
      }
    }
  };

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

  const agentController: AgentController = {
    navigateTo: (step: AppStep) => {
      if (step !== currentStep) {
        setActiveContext(null);
        setCurrentStep(step);
      }
    },
    currentStep: currentStep
  };

  const renderContent = () => {
    switch (currentStep) {
      case AppStep.PROJECT_HUB: // 💡 新增：渲染作品库
        return (
          <ProjectHub 
            projects={projects}
            onSelect={handleSelectProject}
            onCreate={handleCreateProject}
            onDelete={handleDeleteProject}
          />
        );
      case AppStep.KNOWLEDGE_BASE:
        return (
          <KnowledgeBase
            files={files}
            setFiles={setFiles}
            onNext={() => setCurrentStep(AppStep.WORKFLOW_SELECT)}
          />
        );
      case AppStep.WORKFLOW_SELECT:
        return <WorkflowSelection onSelect={(step) => setCurrentStep(step)} />;
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
        return <OutlineGenerator files={files} addGeneratedFile={handleAddGeneratedFile} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (activeProject && currentStep !== AppStep.PROJECT_HUB) {
      return `当前作品：${activeProject.title}`;
    }
    switch (currentStep) {
      case AppStep.PROJECT_HUB: return '我的改编作品库';
      case AppStep.KNOWLEDGE_BASE: return '第一阶段：知识库构建';
      case AppStep.WORKFLOW_SELECT: return '第二阶段：选择工作流';
      default: return '漫改智脑';
    }
  };

  const handleBack = () => {
    setActiveContext(null);
    if (currentStep === AppStep.KNOWLEDGE_BASE || currentStep === AppStep.WORKFLOW_SELECT) {
      setCurrentStep(AppStep.PROJECT_HUB);
    } else {
      setCurrentStep(AppStep.WORKFLOW_SELECT);
    }
  };

  return (
    <Layout 
      title={getTitle()} 
      onBack={currentStep !== AppStep.PROJECT_HUB ? handleBack : undefined}
      contextHandler={activeContext}
      agentController={agentController}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
