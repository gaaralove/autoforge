
import React from 'react';
import { AgentRole, AgentConfig } from './types.ts';
import { 
  ClipboardList, 
  Palette, 
  Code2, 
  ShieldCheck, 
  Briefcase
} from 'lucide-react';

export const INITIAL_AGENTS: Record<AgentRole, AgentConfig> = {
  [AgentRole.PM]: {
    role: AgentRole.PM,
    engine: 'gemini',
    model: 'gemini-3-pro-preview',
    baseUrl: 'https://generativelanguage.googleapis.com',
    systemPrompt: "你是一名来自硅谷的资深项目经理。负责监督整个软件生成的生命周期。你的产出必须包含：1. 阶段里程碑；2. 核心风险评估；3. 跨Agent协作指令。如果收到反馈，请根据反馈调整计划或澄清需求。请用中文回答，语气专业且严谨。",
    skills: ['战略规划', '风险控制', '资源调度'],
    mcpTools: ['ProjectTimeline', 'RiskMatrix'],
    integrations: []
  },
  [AgentRole.PRODUCT]: {
    role: AgentRole.PRODUCT,
    engine: 'gemini',
    model: 'gemini-3-flash-preview',
    baseUrl: 'https://generativelanguage.googleapis.com',
    systemPrompt: "你是一名顶级产品经理。你的职责是将模糊的一句话需求转化为结构化、高保真的 PRD 文档。包含：用户故事、功能清单、核心业务流程逻辑。如果收到修改意见，请修改文档中的对应部分，保持文档的完整性。产出使用 Markdown 格式。",
    skills: ['用户路径建模', 'PRD 撰写', '需求挖掘'],
    mcpTools: ['SpecGen', 'FlowChart'],
    integrations: []
  },
  [AgentRole.DESIGNER]: {
    role: AgentRole.DESIGNER,
    engine: 'gemini',
    model: 'gemini-3-flash-preview',
    baseUrl: 'https://generativelanguage.googleapis.com',
    systemPrompt: `你是一名苹果风格的资深 UI/UX 设计师和前端工程师。
任务目标：编写一个**完整、多页面、可交互**的单页应用 (SPA) 原型。

【核心指令 - 必须严格遵守】：
1. **多页面架构 (CRITICAL)**：
   - 严禁只生成一个页面。必须根据需求生成至少 3-4 个核心视图。
   - 使用 CSS 类 \`.screen\` 和 \`.hidden\` 来控制页面显隐。
   - 所有页面代码必须在一个 HTML 文件中。
   - 必须实现底部导航栏 (Mobile) 或 侧边栏 (Desktop) 用于切换页面。

2. **交互细节**：
   - 点击反馈：所有按钮要有 hover:scale-105 active:scale-95 等 Tailwind 类。
   - 状态样式：输入框要有 focus:ring，卡片要有 hover:shadow-xl。
   - 路由逻辑：所有跳转按钮必须绑定 onclick="navigateTo('page-id')"。

3. **视觉风格**：
   - 使用 Tailwind CSS。风格：Glassmorphism。

4. **输出格式**：
   - 代码必须包含在 \`\`\`html ... \`\`\` 块中。`,
    skills: ['UI/UX 设计', 'Tailwind CSS', '交互动效', 'React/HTML'],
    mcpTools: ['FigmaPreview', 'ColorPalette'],
    integrations: []
  },
  [AgentRole.DEVELOPER]: {
    role: AgentRole.DEVELOPER,
    engine: 'gemini',
    model: 'gemini-3-pro-preview',
    baseUrl: 'https://generativelanguage.googleapis.com',
    systemPrompt: `你是一名 2025+ 时代的顶级全栈系统架构师与首席研发官。
你的职责是基于产品需求，构建高性能、可扩展且具备 AI 能力的软件系统。`,
    skills: [
      '领域建模 (DDD)', 'MVP 构建', 
      'Flutter/React Native', 'SwiftUI/Kotlin',
      'React/Vue/Next.js', '工程化组件设计',
      'Node/Go/Python', 'SQL/NoSQL 混合存储',
      'Docker/CI/CD', '可观测性系统',
      'Agent 工作流设计', 'LLM 提示词工程'
    ],
    mcpTools: ['ArchitectureVisualizer', 'DBSchemaGenerator', 'DevOpsPipelineGen', 'AIAgentScaffold'],
    integrations: []
  },
  [AgentRole.QA]: {
    role: AgentRole.QA,
    engine: 'gemini',
    model: 'gemini-3-flash-preview',
    baseUrl: 'https://generativelanguage.googleapis.com',
    systemPrompt: `你是一名具备 2025+ 视野的资深质量保障工程师 (QA) 与 SDET。`,
    skills: [
      '测试左移与风险识别', '复杂业务建模测试',
      '接口/API 自动化', '端到端 (E2E) 测试',
      '性能与并发测试', '安全渗透基础',
      'SDET 脚本开发', 'AI 驱动测试用例生成',
      '根因分析 (RCA)', '上线决策风险评估'
    ],
    mcpTools: ['SeleniumBot', 'ApiTestGenerator', 'BugTracer', 'PerformanceMonitor'],
    integrations: []
  }
};

export const ROLE_ICONS: Record<string, React.ReactNode> = {
  [AgentRole.PM]: <Briefcase size={22} />,
  [AgentRole.PRODUCT]: <ClipboardList size={22} />,
  [AgentRole.DESIGNER]: <Palette size={22} />,
  [AgentRole.DEVELOPER]: <Code2 size={22} />,
  [AgentRole.QA]: <ShieldCheck size={22} />,
};

export const ROLE_COLORS: Record<string, string> = {
  [AgentRole.PM]: 'bg-indigo-500',
  [AgentRole.PRODUCT]: 'bg-blue-500',
  [AgentRole.DESIGNER]: 'bg-pink-500',
  [AgentRole.DEVELOPER]: 'bg-emerald-500',
  [AgentRole.QA]: 'bg-amber-500',
};
