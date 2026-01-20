export enum FileType {
  NOVEL = 'NOVEL', 
  FORMAT_REF = 'FORMAT_REF', 
  STYLE_REF = 'STYLE_REF', 
  FULL_OUTLINE = 'FULL_OUTLINE', 
  CHARACTER_BIBLE = 'CHARACTER_BIBLE', 
  GENERATED_SCRIPT = 'GENERATED_SCRIPT', 
  OTHER = 'OTHER'
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: FileType;
  content: string; 
  uploadDate: number;
}

export enum AppStep {
  PROJECT_HUB = 'PROJECT_HUB', 
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  WORKFLOW_SELECT = 'WORKFLOW_SELECT',
  SCRIPT_OUTLINE_GEN = 'SCRIPT_OUTLINE_GEN', 
  SCRIPT_GENERATOR = 'SCRIPT_GENERATOR',
  CHARACTER_EXTRACTOR = 'CHARACTER_EXTRACTOR' 
}

export enum FrequencyMode {
  MALE = 'MALE', // 男频
  FEMALE = 'FEMALE' // 女频
}

export enum ModelTier {
  LOGIC_FAST = 'LOGIC_FAST',
  CREATIVE_PRO = 'CREATIVE_PRO'
}

export interface ScriptSegment {
  id: string;
  range: string; 
  content: string;
  summary: string; 
  isLoading: boolean;
}

export interface CharacterProfile {
  name: string;
  gender: string;
  age: string;
  relation: string;
  personality: string;
  appearance: string;
  appearanceChapter: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface GlobalContextHandler {
  name: string; 
  getValue: () => string; 
  setValue: (newValue: string) => void; 
}

export interface AgentController {
  navigateTo: (step: AppStep) => void;
  currentStep: AppStep;
}

export interface Project {
  id: string;
  title: string;
  files: KnowledgeFile[];
  lastModified: number;
  frequencyMode: FrequencyMode;
}
