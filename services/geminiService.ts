import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE, MALE_FREQ_INSTRUCTION, FEMALE_FREQ_INSTRUCTION } from "../constants";
import { FrequencyMode, CharacterProfile, ChatMessage } from "../types";

// Helper to get client (ensure fresh key use)
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// ... (Existing exports: analyzeAdaptationFocus, generateSeasonPlan, generateScriptSegment, extractCharacterOutline, generatePlotSummary) ...

export const analyzeAdaptationFocus = async (
  novelContent: string,
  mode: FrequencyMode
): Promise<string> => {
  const ai = getClient();
  const model = "gemini-3-flash-preview"; 

  const modeText = mode === FrequencyMode.MALE ? "男频（热血/升级/爽文）" : "女频（情感/大女主/甜宠/虐恋）";

  const prompt = `
  你是一名资深的网文改动漫市场分析师。
  
  【任务】：
  请阅读以下原著小说片段，结合 2025 年动漫市场对于【${modeText}】的流行趋势，为编剧提供一份简短的“改编侧重指导”。
  
  【原著片段】：
  ${novelContent.slice(0, 15000)} ...

  【输出要求】：
  1. 字数控制在 200 字以内。
  2. 直接输出建议内容，不要包含“好的”、“以下是建议”等废话。
  3. 建议内容应包含：
     - 节奏建议（如：加快开篇，前三集必须出现第一个大高潮）。
     - 爽点/看点聚焦（如：重点刻画主角的xxx特质，弱化xxx支线）。
     - 观众留存策略（如：每集结尾必须留钩子）。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "无法生成建议，请手动输入。";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "分析服务暂时不可用，请稍后重试。";
  }
};

export const generateSeasonPlan = async (
  novelContent: string,
  seasonName: string,
  episodeCount: string,
  focusInstructions: string,
  mode: FrequencyMode 
): Promise<string> => {
  const ai = getClient();
  const model = "gemini-3-pro-preview"; 

  const modeInstruction = mode === FrequencyMode.MALE ? MALE_FREQ_INSTRUCTION : FEMALE_FREQ_INSTRUCTION;

  const prompt = `
  【任务目标】：请作为一名动画总编剧，根据原著小说，为《${seasonName}》制定一份详细的季度改编大纲。
  
  【核心参数】：
  - 目标受众频段：${mode === FrequencyMode.MALE ? "男频 (Male Frequency)" : "女频 (Female Frequency)"}
  - 预计集数：${episodeCount} 集
  - 单集时长：2-3分钟（动漫爽剧节奏）
  - 核心改编指令：${focusInstructions || "还原原著爽点，加快前期节奏"}

  【原著内容】：
  ${novelContent.slice(0, 100000)} ... (为防止上下文溢出，截取了部分内容)

  【输出要求】：
  请输出一份结构清晰的Markdown文档，**严禁使用任何Emoji图标（如✨🌟📝等）或复杂的分割线符号**，保持专业、干净的商务文档风格。
  
  必须严格包含以下部分：
  1. **原著改编进度**：【重要】必须明确估算并标注本季内容对应原著小说的章节范围（例如：对应原著第1章 至 第158章）。
  2. **本季核心看点**：一句话总结本季主线。
  3. **主要角色成长线**：主角及核心配角在本季的起点与终点。
  4. **分集剧情规划表**：
     请按每 5-10 集为一个节点，规划剧情走向。例如：
     - 第 1-10 集：[开篇/觉醒] 具体事件...
     - 第 11-20 集：[初次冲突] 具体事件...
     ...
  5. **高光时刻/名场面标记**：列出本季必须保留的经典场面。

  请确保逻辑通顺，适合作为后续分集剧本写作的指导蓝图。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `你是一名专业的动画IP改编架构师，擅长宏观叙事与节奏把控。\n${modeInstruction}`,
        temperature: 0.6,
      }
    });
    return response.text || "生成大纲失败，请重试。";
  } catch (error) {
    console.error("Season Planning Error:", error);
    throw error;
  }
};

export const generateScriptSegment = async (
  novelContent: string,
  formatContent: string,
  styleContent: string,
  outlineContent: string,
  characterBibleContent: string, // New parameter for consistency
  mode: FrequencyMode,
  episodeRange: string,
  previousSummary: string,
  previousEndContent: string = ""
): Promise<{ content: string; summary: string }> => {
  const ai = getClient();
  
  const modeInstruction = mode === FrequencyMode.MALE ? MALE_FREQ_INSTRUCTION : FEMALE_FREQ_INSTRUCTION;
  
  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n${modeInstruction}`;
  const model = "gemini-3-pro-preview";

  const prompt = `
  【当前任务】：请根据提供的原著小说内容，创作改编第【${episodeRange}】集的2D动漫剧情脚本。
  
  【核心输入资料】：
  1. **原著小说内容** (剧情细节唯一来源)：
  ${novelContent.slice(0, 50000)} ... (截取部分)
  
  2. **季度大纲/宏观规划** (Master Outline - 剧情走向指导)：
  ${outlineContent ? `【注意：请确保本段剧本的节奏和事件符合大纲中对该阶段的规划】\n${outlineContent.slice(0, 8000)}` : "无季度大纲，请自行把控节奏。"}

  3. **人设圣经/人物档案** (Character Bible - 确保性格统一):
  ${characterBibleContent ? `【注意：台词口癖、人物性格必须严格遵循以下档案，严禁OOC】\n${characterBibleContent.slice(0, 10000)}` : "（无指定人设，请根据原著推断）"}

  4. **排版参考模版** (Format Template)：
  ${formatContent ? `【注意：你必须严格模仿以下内容的格式排版，包括场号格式、对白缩进、动作描写的位置等】\n${formatContent.slice(0, 5000)}` : "无，请使用标准通用的剧本格式。"}

  5. **文笔与叙事风格参考** (Style Reference)：
  ${styleContent ? `【注意：你必须深度分析并模仿以下内容的文笔风格。包括：叙述者的语气、形容词的使用习惯、台词的口语化程度、画面的描写细腻度】\n${styleContent.slice(0, 5000)}` : "无，请使用标准热血动漫风格。"}

  6. **上下文连贯性资料** (Context & Continuity):
  - **前情提要** (Story so far): 
    ${previousSummary || "这是第一段，无前情提要。"}
  
  - **上一段落结尾实录** (The ending of the previous batch):
    ${previousEndContent ? `...${previousEndContent}` : "（无，这是开篇）"}

  【执行指令】：
  Step 1 (宏观对齐): 查阅[季度大纲]，确认【${episodeRange}】这一段落在大纲中处于什么阶段。
  Step 2 (人设校准): 查阅[人设圣经]，确保本集登场人物的对话风格（如口头禅、语气）与档案一致。
  Step 3 (无缝衔接): **极重要**。请仔细阅读[上一段落结尾实录]。你的开篇第一场戏必须在时间、地点、情绪上与上一段结尾**无缝衔接**。
  Step 4 (剧情改编): 依据原著剧情，落实到具体的脚本编写中。

  【输出要求】：
  - 输出内容必须严格遵循【排版参考】的视觉结构。
  - 输出的台词和描述必须带有【文笔参考】的味道。
  - 严格遵守系统指令中的所有红线（不加人、不加戏、原著至上）。
  - 在脚本最后，附带一段【本段剧情摘要】，用于生成下一段的上下文记忆。
  
  请直接输出脚本内容，最后以 "---SUMMARY---" 分隔摘要。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7, 
      }
    });

    const text = response.text || "";
    const [content, summaryPart] = text.split("---SUMMARY---");
    
    return {
      content: content.trim(),
      summary: summaryPart ? summaryPart.trim() : "无摘要生成"
    };
  } catch (error) {
    console.error("Gemini Script Generation Error:", error);
    throw error;
  }
};

export const extractCharacterOutline = async (
  scriptContent: string
): Promise<CharacterProfile[]> => {
  const ai = getClient();
  const model = "gemini-3-flash-preview"; 

  const prompt = `
  请分析以下动漫剧情脚本，提取所有登场人物的详细资料。
  
  【剧情脚本内容】：
  ${scriptContent.slice(0, 40000)}

  【任务要求】：
  - 仅提取脚本中实际登场或被提及的重要人物。
  - 严禁编造人物。
  - 必须返回 JSON 格式数据。

  【输出结构】：
  一个包含以下对象的数组：
  {
    "name": "姓名",
    "gender": "性别",
    "age": "推断年龄",
    "relation": "与主角/重要配角关系",
    "personality": "性格特征",
    "appearance": "外貌/形象描写",
    "appearanceChapter": "首次登场集数/章节"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              gender: { type: Type.STRING },
              age: { type: Type.STRING },
              relation: { type: Type.STRING },
              personality: { type: Type.STRING },
              appearance: { type: Type.STRING },
              appearanceChapter: { type: Type.STRING },
            }
          }
        }
      }
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr) as CharacterProfile[];
  } catch (error) {
    console.error("Gemini Outline Extraction Error:", error);
    throw error;
  }
};

export const generatePlotSummary = async (
  targetContent: string,
  styleContent: string,
  novelContent?: string
): Promise<string> => {
  const ai = getClient();
  const model = "gemini-3-pro-preview";

  const prompt = `
  【任务目标】：请根据【季度规划大纲】和【原著小说】，严格参照【写法参考范例】的格式和侧重点，生成一份商业性的剧情梗概。
  
  【核心资料】：
  1. **结构蓝本/季度规划** (Quarterly Plan):
  ${targetContent.slice(0, 50000)} ... (这是剧情走向的骨架)

  ${novelContent ? `
  2. **原著小说全文/片段** (Source Novel):
  ${novelContent.slice(0, 300000)} ... (这是填充血肉的素材库)
  ` : ''}

  3. **【写法参考范例】** (MANDATORY FORMAT REFERENCE):
  ${styleContent ? `请深度分析并百分百模仿以下文本的**排版格式**、**分段方式**和**总结侧重点**：\n${styleContent.slice(0, 5000)}` : "请使用清晰的【事件】+【看点】的格式。"}

  【写作核心要求】：
  1. **❌ 严禁提取具体台词**：不要写“他说...她说...”，不要任何对话描写。
  2. **✅ 聚焦“事件”与“爽点”**：
     - 请只概括这一阶段“发生了什么核心事件”（如：主角突破境界、反派上门挑衅）。
     - 重点标注“爽点/看点在哪里”（如：扮猪吃虎的快感、绝地反击的热血、宝物到手的满足）。
  3. **✅ 严格结构模仿**：
     - 如果【写法参考范例】是用列表写的，你就用列表。
     - 如果它是用“第X集：[标题] 内容”写的，你就照做。
     - 如果它有特殊的符号或小标题（如【高光时刻】），你也必须保留。
  4. **资料整合**：以【季度规划】确定的集数/进度为轴，从【原著小说】中提取具体的招式名、地名、宝物名等细节来填充事件描述，确保内容不空洞。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "你是一名商业动漫策划，你的工作是提炼剧情卖点和节奏，而不是讲睡前故事。请严格按照用户提供的参考范例格式输出。",
        temperature: 0.5,
      }
    });
    return response.text || "生成剧情大纲失败，请重试。";
  } catch (error) {
    console.error("Plot Summary Generation Error:", error);
    throw error;
  }
};

/**
 * Chat functionality
 */
export const streamChatResponse = async function* (
  history: ChatMessage[],
  newMessage: string,
  currentContext?: string,
  contextName?: string
) {
  const ai = getClient();
  const model = "gemini-3-flash-preview";

  // We don't use the 'chat' history object directly because we want to inject dynamic context
  // into the prompt each time.
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "你是一个嵌入在‘漫改智脑’系统中的AI助手。用户可能正在编写剧本或大纲。如果用户提供了[当前编辑器内容]，你的首要任务是帮助用户修改、润色或续写这部分内容。如果用户要求修改，请直接输出修改后的完整文本，不要多余的废话，以便用户直接复制或应用。"
    }
  });

  // Construct history for the API
  // We need to map our ChatMessage type to the API's Content type
  const apiHistory = history.filter(h => !h.isStreaming).map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  // Add the current message with context context
  let fullPrompt = newMessage;
  if (currentContext) {
    fullPrompt = `
[系统提示：用户当前正在编辑的文件是 "${contextName || '未命名'}"]
[当前编辑器中的内容如下]:
\`\`\`
${currentContext.slice(0, 30000)} ... (content truncated if too long)
\`\`\`

[用户的指令]:
${newMessage}

[你的任务]:
根据用户的指令修改或回答。如果涉及对内容的修改，请输出修改后的版本。
`;
  }

  // To simulate history with single-turn context injection properly, we might just pass the prompt.
  // But strictly following SDK, we should use sendMessageStream. 
  // We will manually prime the chat history first if needed, but simpler is to just send the message
  // assuming the instance is fresh. 
  // *Correction*: To keep history, we should add previous turns to `history` param in `chats.create`.
  
  // Re-creating chat with history
  const chatWithHistory = ai.chats.create({
    model,
    history: apiHistory,
    config: {
      systemInstruction: "你是一个嵌入在‘漫改智脑’系统中的AI助手。你的目标是辅助用户进行网文改动漫的创作。当用户要求修改当前内容时，请提供高质量的修改建议。"
    }
  });

  const result = await chatWithHistory.sendMessageStream({ message: fullPrompt });

  for await (const chunk of result) {
    yield chunk.text;
  }
};