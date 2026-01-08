
export enum AgentRole {
  PM = '项目经理',
  PRODUCT = '产品经理',
  DESIGNER = '设计师',
  DEVELOPER = '研发',
  QA = '测试'
}

export enum StepStatus {
  IDLE = '待启动',
  WORKING = '进行中',
  AWAIT_REVIEW = '待验收',
  APPROVED = '验收通过',
  REJECTED = '已驳回',
  PROJECT_COMPLETED = '项目已归档'
}

export type ModelEngine = 'gemini' | 'custom'; // 'gemini' 现在映射为 '平台内置引擎'

export type MembershipStatus = 'trial' | 'member' | 'expired';

export interface User {
  username: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  activatedCode: string | null;
  membershipStatus: MembershipStatus;
  expiryDate: number | null; // Timestamp
  createdAt: number;
}

export interface InvitationCode {
  code: string;
  usedBy: string | null; // username
  createdAt: number;
}

export interface PaymentOrder {
  id: string;
  username: string;
  amount: number;
  method: 'alipay' | 'wechat';
  status: 'pending' | 'completed' | 'rejected';
  voucher?: string; // Base64 payment screenshot
  timestamp: number;
}

export interface PaymentConfig {
  alipayEnabled: boolean;
  wechatEnabled: boolean;
  alipayQr: string; // Base64
  wechatQr: string; // Base64
  price: number; // 1 year membership price
}

export interface BuiltInEngineConfig {
  provider: 'gemini' | 'openai-compatible';
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'API' | 'Platform' | 'MCP';
  url: string;
  description: string;
}

export interface AgentConfig {
  role: AgentRole;
  engine: ModelEngine;
  model: string;
  baseUrl: string;
  apiKey?: string; 
  systemPrompt: string;
  skills: string[];
  mcpTools: string[];
  integrations: Integration[];
  evolutionVersion?: number;
}

export interface ContentVersion {
  id: string;
  timestamp: number;
  thinking?: string;
  content: string;
  feedbackTrigger?: string;
  rating?: 'like' | 'dislike';
}

export interface ProjectEvaluation {
  score: number;
  feedback: string;
  timestamp: number;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  type: 'action' | 'evolution' | 'error';
  message: string;
  role?: AgentRole;
}

export interface ProjectState {
  id: string;
  originalRequirement: string;
  currentStep: AgentRole | 'FINAL_EVALUATION';
  status: StepStatus;
  steps: Record<AgentRole, {
    status: StepStatus;
    versions: ContentVersion[];
    feedback: string[];
    logs: string[];
  }>;
  evaluation?: ProjectEvaluation;
  systemLogs: SystemLog[]; 
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
