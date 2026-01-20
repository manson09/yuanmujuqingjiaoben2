import { Type } from "@google/genai"; // 仅保留 Type 用于类型定义
import { SYSTEM_INSTRUCTION_BASE, MALE_FREQ_INSTRUCTION, FEMALE_FREQ_INSTRUCTION } from "../constants";
import { FrequencyMode, CharacterProfile, ChatMessage, ModelTier } from "../types";

// 💡 适配 OpenRouter 的变量获取
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://openrouter.ai/api/v1';

// 💡 双模型路由 ID 映射
const MODELS = {
  LOGIC_FAST: "google/gemini-3-flash-preview", // 极速逻辑版
  CREATIVE_PRO: "deepseek/deepseek-v3.2" ,// 沉浸文笔版
};

async function callOpenRouter(model: string, system: string, user: string, temperature: number, mode: FrequencyMode, jsonMode = false) {
  // 1. 男频爽感指令
  const maleAntiCopy = `
【最高指令：男频爽感算法】
- 冲突暴力化：无温水戏，每场戏必是「生死级危机 / 尊严级挑衅 / 战力碾压式爆发」，冲突即时触发、即时反击，无拖沓铺垫；
- 视觉奇观化：所有战力描写全部转化为「具象影视特效画面」，拒绝抽象描述，例：气浪震碎青石、虚空凝剑裂风、拳劲崩裂山河、灵力覆体生金光；
- 语感压迫性：台词要狂、要锐、要带刺，多用短句 + 反问 + 碾压式宣言，字字铿锵，气场拉满，无废话对白；
- 节奏锚点：全程快节奏推进，结尾必须制造「极致钩子式悬念」，卡点在「底牌未出、强敌突现、战力破阶、狠话落地」任一爽感节点，留足期待感；`;

  // 2. 女频爽感指令
  const femaleAntiCopy = `
【最高指令：女频爽感算法】
- 情绪极致化：重「微表情雕刻」，核心写「眼技 + 神态细节」，例：眼尾泛红、瞳仁微颤、含泪不坠、眸光冷冽如冰、唇角噙一抹淡凉笑意；写出宿命的厚重感与宿命反击的爽感，情绪藏于眉眼，不流于表面；
- 心理博弈：台词极致「藏三分露七分」，全是潜台词，话里藏刀、绵里裹针，要么温柔语气说诛心话，要么极简冷语戳软肋；先听后说、先示弱再反杀，话不说满，留白处皆是碾压；
- 细节打脸：无硝烟式降维打击，打脸不靠嘶吼，靠「身份 / 智力 / 格局 / 人脉」的精准碾压，例：不动声色亮底牌让对方失态、预判算计反将一军、旁人躬身行礼的瞬间让对方颜面扫地；
- 节奏锚点：全程慢沉节奏铺情绪，结尾精准卡点「关系决裂瞬间 / 真相揭开刹那 / 诛心台词落地 / 对方失态崩溃」，卡在情绪最浓烈、爽感最顶峰的节点收束。`;

  const factPreservation = `
\n【最高创作铁律 - 严禁复读 & 严禁乱改】
- 剧情事实：严禁漏掉“穿越”、“系统”、“异世界”等核心背景。
- 严禁自创：不准增加原著没有的人物或重大剧情，不准复读。`;

  const modeSpecificPrompt = mode === FrequencyMode.MALE ? maleAntiCopy : femaleAntiCopy;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AniAdapt AI Brain',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user + modeSpecificPrompt + factPreservation + antiCopy }
      ],
      temperature: temperature,
      response_format: jsonMode ? { type: "json_object" } : undefined
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export const analyzeAdaptationFocus = async (
  novelContent: string,
  mode: FrequencyMode
): Promise<string> => {
  const model = MODELS.LOGIC_FAST;
  const modeText = mode === FrequencyMode.MALE ? "男频（热血/升级/爽文）" : "女频（情感/大女主/甜宠/虐恋）";

  const prompt = `
  你是一名资深的网文改动漫市场分析师。
  
  【任务】：
  请阅读以下原著小说片段，结合 2026 年最新动漫市场对于【${modeText}】的流行趋势，为编剧提供一份简短的“改编侧重指导”。
  
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

  return callOpenRouter(model, "你是一名专业的市场分析专家。", prompt, 0.7);
};

export const generateSeasonPlan = async (
  novelContent: string,
  seasonName: string,
  episodeCount: string,
  focusInstructions: string,
  mode: FrequencyMode,
  modelTier: ModelTier = ModelTier.CREATIVE_PRO
): Promise<string> => {
  const model = modelTier === ModelTier.LOGIC_FAST ? MODELS.LOGIC_FAST : MODELS.CREATIVE_PRO;
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

  return callOpenRouter(model, `你是一名专业的动画IP改编架构师，擅长宏观叙事与节奏把控。\n${modeInstruction}`, prompt, 0.7);
};

export const generateScriptSegment = async (
  novelContent: string,
  formatContent: string,
  styleContent: string,
  outlineContent: string,
  characterBibleContent: string, 
  mode: FrequencyMode,
  episodeRange: string,
  previousSummary: string,
  previousEndContent: string = "",
  modelTier: ModelTier = ModelTier.CREATIVE_PRO
): Promise<{ content: string; summary: string }> => {
  const modelName = modelTier === ModelTier.LOGIC_FAST ? MODELS.LOGIC_FAST : MODELS.CREATIVE_PRO;
  const modeInstruction = mode === FrequencyMode.MALE ? MALE_FREQ_INSTRUCTION : FEMALE_FREQ_INSTRUCTION;
  
  let tierInstruction = "";
  if (modelTier === ModelTier.CREATIVE_PRO) {
      tierInstruction = `
      【高阶创作模式已激活】
      你现在的角色是金牌编剧，极其擅长编写男女频爽剧剧情脚本。请注意：
      1. **拒绝流水账**：不要平铺直叙。使用侧面描写、环境烘托、微表情来传达信息。
      2. **强化潜台词**：人物对话不要过于直白，要体现人物的性格底色和言外之意。
      3. **镜头感**：文字必须具有极强的画面指引性，每一行都要能被原画师直接想象成画面。
      `;
  }

  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n${modeInstruction}\n${tierInstruction}`;

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
  - 输出内容必须严格遵循【排版参考】的视觉结构，不生成【排版参考】内没有的其他符号
  - 输出的台词和描述必须带有【文笔参考】的味道。
  - 严格遵守系统指令中的所有红线（不加人、不加戏、原著至上）。
  - 在脚本最后，附带一段【本段剧情摘要】，用于生成下一段的上下文记忆。
  
  请直接输出脚本内容，最后以 "---SUMMARY---" 分隔摘要。
  `;

  const result = await callOpenRouter(modelName, fullSystemInstruction, prompt, 0.8, mode);
  const [content, summaryPart] = result.split("---SUMMARY---");
  
  return {
    content: content.trim(),
    summary: summaryPart ? summaryPart.trim() : "无摘要生成"
  };
};

export const extractCharacterOutline = async (scriptContent: string, mode: FrequencyMode): Promise<CharacterProfile[]> => {
  const prompt = `从以下脚本提取人物JSON：\n${scriptContent.slice(0, 40000)}`;
  const res = await callOpenRouter(MODELS.LOGIC_FAST, "你是一个专业的人设提取专家。", prompt, 0.3, mode,true);
  return JSON.parse(res.match(/\[.*\]/s)?.[0] || "[]");
};

export const generatePlotSummary = async (
  targetContent: string,
  styleContent: string,
  mode: FrequencyMode,
  novelContent?: string
): Promise<string> => {
  // 💡 重点修改：强制使用 Gemini 3 (LOGIC_FAST)，因为它能吃下你 40 万字的原著，Claude (CREATIVE_PRO) 容不下。
  const model = MODELS.LOGIC_FAST;

  const prompt = `
  【任务目标】：请根据【季度规划大纲】和【原著小说】，严格参照【写法参考范例】的格式和侧重点，生成一份商业性的剧情梗概。
  
  【核心资料】：
  1. **结构蓝本/季度规划** (Quarterly Plan):
  ${targetContent.slice(0, 50000)} ... (这是剧情走向的骨架)

  ${novelContent ? `
  2. **原著小说全文/片段** (Source Novel):
  ${novelContent.slice(0, 400000)} ... (Gemini 3 支持百万上下文，这里截取你全部的 40 万字原著)
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

  return callOpenRouter(model, "你是一名商业动漫策划，负责从海量原著中提炼卖点。", prompt, 0.5, mode);
};

export const streamChatResponse = async function* (
  history: ChatMessage[],
  newMessage: string,
  currentContext?: string,
  contextName?: string
) {
  // 💡 使用你在顶部定义的模型变量
  const model = MODELS.LOGIC_FAST;

  // 🔴 以下文字 100% 保留自你的原代码，不作任何删减
  const chatInstruction = `
  你是一个嵌入在‘漫改智脑’系统中的高级智能体 (Agent)。
  你的职责不仅是回答问题，还要根据用户的意图控制系统导航。

  【能力与工具】
  系统包含以下核心工作台：
  1. 知识库 (KNOWLEDGE_BASE): 上传小说、参考资料。
  2. 季度规划 (SEASON_PLANNER): 负责宏观大纲、分集结构。这是编剧的第一步。
  3. 脚本生成 (SCRIPT_GENERATOR): 负责具体写剧本。如果用户提到 "Claude", "文笔好", "写正文", 请引导至此。
  4. 人物提取 (OUTLINE_GENERATOR): 负责提取人设。

  【控制协议】
  如果用户要求进行某项特定任务，请在回复的开头使用特殊指令代码进行跳转。
  指令格式：[[CMD:TARGET_STEP]]
  
  TARGET_STEP 可选值：
  - KNOWLEDGE_BASE
  - SEASON_PLANNER
  - SCRIPT_GENERATOR
  - OUTLINE_GENERATOR

  【示例】
  用户：“开始写剧本吧” / “用Claude生成第一集”
  你：“[[CMD:SCRIPT_GENERATOR]] 好的，已为您切换到【剧情脚本生成】工作台。在这里我们将利用高文笔模型进行创作。”

  用户：“我要先做大纲”
  你：“[[CMD:SEASON_PLANNER]] 没问题，已跳转至【季度改编规划】。”

  如果用户只是闲聊或修改当前文本，则不需要输出指令代码。
  当前若有编辑器内容传入，请优先处理文本润色任务。
  `;

  // 💡 构造上下文
  let fullPrompt = newMessage;
  if (currentContext) {
    fullPrompt = `
[系统提示：用户当前正在编辑的文件是 "${contextName || '未命名'}"]
[当前编辑器中的内容如下]:
\`\`\`
${currentContext.slice(0, 30000)}
\`\`\`

[用户的指令]:
${newMessage}
`;
  }

  // 💡 发送请求到 OpenRouter (支持流式打字效果)
 const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      // 💡 重点：确保这里使用的是反引号 ` 而不是单引号 '
      'Authorization': `Bearer ${API_KEY}`, 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: chatInstruction },
        ...history.map(h => ({ role: h.role, content: h.text })),
        { role: 'user', content: fullPrompt }
      ],
      stream: true // 开启流式传输
    }),
  });

  // 💡 处理流式返回的数据块
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          const content = json.choices[0].delta.content || "";
          yield content;
        } catch (e) {}
      }
    }
  }
};
