
import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, AgentConfig, ProjectState, ProjectEvaluation } from "../types.ts";
import { authService } from "./authService.ts";

/**
 * Helper to get the API Key from the environment
 */
const getApiKey = () => {
  // Always prioritize the built-in configuration if provided by the admin
  const builtInConfig = authService.getBuiltInEngineConfig();
  if (builtInConfig?.apiKey) return builtInConfig.apiKey;
  
  // Fallback to the environment variable injected during build/execution
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

async function callLlmApi(baseUrl: string, model: string, apiKey: string, systemPrompt: string, userPrompt: string) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || ''}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API 错误 (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export const generateAgentOutput = async (
  agent: AgentConfig,
  requirement: string,
  context: string,
  feedback?: string
) => {
  const isIteration = !!feedback;
  
  const prompt = `
    你现在扮演的角色: ${agent.role}
    核心系统指令: ${agent.systemPrompt}
    
    【你的专业能力】: ${agent.skills.join(', ')}
    【可用工具】: ${agent.mcpTools.join(', ')}

    项目原始需求: ${requirement}
    
    =========== 上下文环境 (Context) ===========
    ${context}
    =========================================
    
    ${isIteration 
      ? `
    【当前任务类型】: !!! 修改/迭代 (CRITICAL) !!!
    【用户反馈/修改意见】: "${feedback}"
    
    指令：
    1. 请仔细阅读用户的反馈。
    2. 基于上下文中的【上一版本交付物】，进行修改。
    3. 如果你是设计师 (DESIGNER)，必须输出修改后完整的 HTML 代码，而不仅仅是修改的部分。
    4. 在 <thought> 中解释你如何根据反馈修改了设计或逻辑。
      ` 
      : `
    【当前任务类型】: 初始创建
    指令：
    1. 根据项目背景及上下文，产出属于你角色的专业交付物。
    2. 确保逻辑连贯，覆盖需求。
      `
    }
    
    输出格式要求：
    1. 必须在 <thought> 中包含你的推理过程、决策逻辑。
    2. 必须在 <output> 标签中包含你的正式交付成果（Markdown 格式，如果是设计师则包含 HTML）。
  `;

  try {
    let text = "";

    if (agent.engine === 'gemini') {
      const builtInConfig = authService.getBuiltInEngineConfig();
      
      if (builtInConfig.provider === 'gemini') {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: builtInConfig.model,
          contents: prompt,
          config: {
            systemInstruction: agent.systemPrompt,
            thinkingConfig: (builtInConfig.model.includes('gemini-3') || builtInConfig.model.includes('gemini-2.5')) 
              ? { thinkingBudget: builtInConfig.model.includes('pro') ? 32768 : 24576 } 
              : undefined
          }
        });
        text = response.text || "";
      } else {
        text = await callLlmApi(builtInConfig.baseUrl, builtInConfig.model, builtInConfig.apiKey, agent.systemPrompt, prompt);
      }
    } else {
      text = await callLlmApi(agent.baseUrl, agent.model, agent.apiKey || '', agent.systemPrompt, prompt);
    }

    const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/i);
    const outputMatch = text.match(/<output>([\s\S]*?)<\/output>/i);

    const thinking = thoughtMatch ? thoughtMatch[1].trim() : "思维链路已在引擎底层处理。";
    const content = outputMatch ? outputMatch[1].trim() : text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();

    return { thinking, content };
  } catch (error: any) {
    console.error(`[${agent.role}] 生成异常:`, error);
    return {
      thinking: "神经网络连接受阻",
      content: `生成失败: ${error.message}。\n\n请检查：\n1. 请检查平台【管控中心】中的内置引擎配置是否正确。\n2. 如果使用自定义 API，请确认 Base URL、Model ID 及 API Key 是否正确。`
    };
  }
};

export const evolveAgentMatrix = async (
  project: ProjectState,
  evaluation: ProjectEvaluation,
  currentAgents: Record<AgentRole, AgentConfig>
): Promise<Record<AgentRole, AgentConfig>> => {
  const builtInConfig = authService.getBuiltInEngineConfig();
  const history = project.systemLogs
    .map(log => `${log.role || '系统'}: ${log.message}`)
    .join('\n');

  const prompt = `
    作为 Meta-PM，你需要根据项目完成情况进化整个 Agent 矩阵。
    
    最终评分: ${evaluation.score}/5
    用户反馈: ${evaluation.feedback}
    
    项目执行历史:
    ${history}
    
    请针对每个角色，优化其 'systemPrompt' 和 'skills'。以 JSON 格式返回。
    必须反映用户在项目过程中的偏好。
  `;

  try {
    let text = "";
    if (builtInConfig.provider === 'gemini') {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: builtInConfig.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: Object.values(AgentRole).reduce((acc: any, role) => {
              acc[role] = {
                type: Type.OBJECT,
                properties: {
                  newPrompt: { type: Type.STRING },
                  newSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              };
              return acc;
            }, {})
          }
        }
      });
      text = response.text || "{}";
    } else {
      text = await callLlmApi(builtInConfig.baseUrl, builtInConfig.model, builtInConfig.apiKey, "You are a Meta-PM expert.", prompt);
    }

    const updates = JSON.parse(text);
    const evolvedAgents = { ...currentAgents };

    Object.values(AgentRole).forEach(role => {
      if (updates[role]) {
        evolvedAgents[role] = {
          ...evolvedAgents[role],
          systemPrompt: updates[role].newPrompt || evolvedAgents[role].systemPrompt,
          skills: Array.from(new Set([...evolvedAgents[role].skills, ...(updates[role].newSkills || [])])),
          evolutionVersion: (evolvedAgents[role].evolutionVersion || 0) + 1
        };
      }
    });

    return evolvedAgents;
  } catch (error) {
    console.error("进化引擎失效:", error);
    return currentAgents;
  }
};
