
export enum FileType {
  NOVEL = 'NOVEL', // 原著小说
  FORMAT_REF = 'FORMAT_REF', // 排版参考 (原参考脚本)
  STYLE_REF = 'STYLE_REF', // 文笔参考
  SEASON_OUTLINE = 'SEASON_OUTLINE', // 季度/剧情大纲
  CHARACTER_BIBLE = 'CHARACTER_BIBLE', // 人设圣经/人物小传
  GENERATED_SCRIPT = 'GENERATED_SCRIPT', // 已生成的脚本
  OTHER = 'OTHER'
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: FileType;
  content: string; // Text content for analysis
  uploadDate: number;
}

export enum AppStep {
  PROJECT_HUB = 'PROJECT_HUB', 
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  WORKFLOW_SELECT = 'WORKFLOW_SELECT',
  SEASON_PLANNER = 'SEASON_PLANNER', // 新增：季度规划
  SCRIPT_GENERATOR = 'SCRIPT_GENERATOR',
  OUTLINE_GENERATOR = 'OUTLINE_GENERATOR'
}

export enum FrequencyMode {
  MALE = 'MALE', // 男频
  FEMALE = 'FEMALE' // 女频
}

export enum ModelTier {
  LOGIC_FAST = 'LOGIC_FAST',       // 对应 Gemini Flash (快，逻辑好，大窗口)
  CREATIVE_PRO = 'CREATIVE_PRO'    // 对应 Gemini Pro (慢，文笔极佳，拟人度高)
}

export interface ScriptSegment {
  id: string;
  range: string; // e.g., "1-3集"
  content: string;
  summary: string; // Context for next segment
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

// Chat Related Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface GlobalContextHandler {
  name: string; // e.g. "季度结构规划", "脚本-第1-3集"
  getValue: () => string; // Function to get current editor content
  setValue: (newValue: string) => void; // Function to replace editor content
}

// New: Agent Control Interface
export interface AgentController {
  navigateTo: (step: AppStep) => void;
  currentStep: AppStep;
}
export interface Project {
  id: string;
  title: string;               // 小说名称
  files: KnowledgeFile[];      // 属于该项目的知识库文件（原著、参考等）
  lastModified: number;        // 最后修改时间戳
  frequencyMode: FrequencyMode;// 该项目的受众模式（男频/女频）
}
