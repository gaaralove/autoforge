
import React, { useState, useEffect, useRef } from 'react';
import { 
  AgentRole, 
  StepStatus, 
  AgentConfig, 
  ProjectState, 
  ContentVersion, 
  ProjectEvaluation, 
  SystemLog, 
  User, 
  PaymentConfig 
} from './types.ts';
import { INITIAL_AGENTS, ROLE_ICONS, ROLE_COLORS } from './constants.tsx';
import { generateAgentOutput, evolveAgentMatrix } from './services/geminiService.ts';
import { authService } from './services/authService.ts';
import AgentConfigPanel from './components/AgentConfigPanel.tsx';
import ResultDisplay from './components/ResultDisplay.tsx';
import AuthBarrier from './components/AuthBarrier.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { 
  Rocket, 
  Settings2, 
  BrainCircuit, 
  Activity, 
  Sparkles, 
  Layout, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  ShieldAlert, 
  Key, 
  X, 
  ShieldEllipsis, 
  Zap, 
  RefreshCw
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [agents, setAgents] = useState<Record<AgentRole, AgentConfig>>(INITIAL_AGENTS);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [inputReq, setInputReq] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'config' | 'admin'>('workflow');

  const [showUserPopover, setShowUserPopover] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const userPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userPopoverRef.current && !userPopoverRef.current.contains(event.target as Node)) {
        setShowUserPopover(false);
      }
    };
    if (showUserPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserPopover]);

  const handleLogout = () => {
    if (confirm('警告：确定要断开与神经工厂的连接并注销身份吗？')) {
      authService.logout();
      setUser(null);
      setShowUserPopover(false);
      window.location.reload();
    }
  };

  const handleSwitchAccount = () => {
    if (confirm('正在安全切断当前神经链路... 确定要切换至另一个身份登录吗？')) {
      authService.logout();
      setUser(null);
      setShowUserPopover(false);
      window.location.reload();
    }
  };

  const handleChangePassword = () => {
    setPwdError('');
    try {
      authService.changePassword(oldPwd, newPwd);
      alert('矩阵访问密钥已成功重置，新权重已生效。');
      setShowPasswordModal(false);
      setOldPwd('');
      setNewPwd('');
    } catch (e: any) {
      setPwdError(e.message);
    }
  };

  const addLog = (message: string, type: SystemLog['type'] = 'action', role?: AgentRole) => {
    const newLog: SystemLog = {
      id: "LOG-" + Date.now(),
      timestamp: Date.now(),
      type,
      message,
      role
    };
    setProject(prev => prev ? ({ ...prev, systemLogs: [...prev.systemLogs, newLog] }) : null);
  };

  const createNewProject = (requirement: string) => {
    const initialSteps: any = {};
    Object.values(AgentRole).forEach(role => {
      initialSteps[role] = {
        status: StepStatus.IDLE,
        versions: [],
        feedback: [],
        logs: []
      };
    });

    const newProject: ProjectState = {
      id: "AF-" + Math.floor(Math.random() * 100000),
      originalRequirement: requirement,
      currentStep: AgentRole.PRODUCT,
      status: StepStatus.WORKING,
      steps: initialSteps,
      systemLogs: [{
        id: "START",
        timestamp: Date.now(),
        type: 'action',
        message: `神经工厂已上线。目标愿景：${requirement}`
      }]
    };

    setProject(newProject);
    triggerAgentStep(newProject, AgentRole.PRODUCT);
  };

  const triggerAgentStep = async (currentProject: ProjectState, role: AgentRole, feedback?: string) => {
    setIsProcessing(true);
    addLog(feedback ? `正在消化用户迭代指令...` : `正在唤醒 ${role} 算力节点...`, 'action', role);

    let context = "";
    Object.entries(currentProject.steps).forEach(([r, data]) => {
      const latestVersion = data.versions[data.versions.length - 1];
      if (latestVersion) {
        context += `\n--- [${r} 既定方案] ---\n${latestVersion.content}\n`;
      }
    });

    const { thinking, content } = await generateAgentOutput(
      agents[role], 
      currentProject.originalRequirement, 
      context, 
      feedback
    );

    const newVersion: ContentVersion = {
      id: "V-" + Date.now(),
      timestamp: Date.now(),
      thinking,
      content,
      feedbackTrigger: feedback
    };

    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [role]: { 
            ...prev.steps[role], 
            status: StepStatus.AWAIT_REVIEW, 
            versions: [...prev.steps[role].versions, newVersion]
          }
        }
      };
    });
    setIsProcessing(false);
  };

  const handleAccept = async (role: AgentRole) => {
    if (!project) return;
    addLog(`${role} 节点成果通过验证。同步至下一环节。`, 'action', role);

    const roles = Object.values(AgentRole);
    const currentIndex = roles.indexOf(role);
    const nextRole = roles[currentIndex + 1];

    if (!nextRole) {
      setProject(prev => prev ? ({
        ...prev,
        currentStep: 'FINAL_EVALUATION', 
        status: StepStatus.APPROVED,
        steps: { ...prev.steps, [role]: { ...prev.steps[role], status: StepStatus.APPROVED } }
      }) : null);
      return;
    }

    setProject(prev => prev ? ({
      ...prev,
      currentStep: nextRole,
      steps: { ...prev.steps, [role]: { ...prev.steps[role], status: StepStatus.APPROVED } }
    }) : null);

    triggerAgentStep({
      ...project,
      steps: { ...project.steps, [role]: { ...project.steps[role], status: StepStatus.APPROVED } }
    }, nextRole);
  };

  const handleFeedback = (role: AgentRole, feedback: string) => {
    if (!project) return;
    setProject(prev => prev ? ({
      ...prev,
      steps: {
        ...prev.steps,
        [role]: { ...prev.steps[role], feedback: [...prev.steps[role].feedback, feedback] }
      }
    }) : null);
    triggerAgentStep(project, role, feedback);
  };

  const handleFinalProjectEvaluation = async (evaluation: ProjectEvaluation) => {
    if (!project) return;
    setIsProcessing(true);
    addLog(`项目合成完毕。综合效能评分: ${evaluation.score}/5`, 'action');

    const evolvedAgents = await evolveAgentMatrix(project, evaluation, agents);
    setAgents(evolvedAgents);
    setProject(prev => prev ? ({ ...prev, evaluation, status: StepStatus.PROJECT_COMPLETED }) : null);
    
    addLog(`全域神经权重已完成进化。`, 'evolution');
    setIsProcessing(false);
  };

  if (!user || (!user.activatedCode && user.role !== 'admin')) {
    return <AuthBarrier onAuthenticated={u => setUser(u)} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-blue-500/30">
      <aside className="w-20 bg-[var(--bg-sidebar)] border-r border-[var(--glass-border)] flex flex-col items-center py-8 gap-8 shrink-0 backdrop-blur-3xl z-50">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-2xl animate-pulse shrink-0">
          <BrainCircuit size={28} className="text-white" />
        </div>
        
        <nav className="flex flex-col gap-5 flex-1 items-center">
          <button onClick={() => setActiveTab('workflow')} className={`p-3.5 rounded-xl transition-all ${activeTab === 'workflow' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`} title="协作工作流">
            <Layout size={24} />
          </button>
          <button onClick={() => setActiveTab('config')} className={`p-3.5 rounded-xl transition-all ${activeTab === 'config' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`} title="神经矩阵配置">
            <Settings2 size={24} />
          </button>
          {user.role === 'admin' && (
            <button onClick={() => setActiveTab('admin')} className={`p-3.5 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`} title="管控中心">
              <ShieldAlert size={24} />
            </button>
          )}
        </nav>

        <div className="flex flex-col gap-5 items-center pb-4 relative" ref={userPopoverRef}>
           <button 
             onClick={() => setShowUserPopover(!showUserPopover)}
             className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${showUserPopover ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-[var(--glass-border)] border-white/5 text-blue-400 hover:scale-110'}`} 
             title={`当前节点: ${user.username}`}
           >
             <UserIcon size={20} />
           </button>
           
           <div className={`absolute left-full bottom-0 pl-4 transition-all z-[100] duration-300 ${showUserPopover ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
              <div className="w-72 bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative">
                 <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-blue-500/30">
                      {user.username.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-black text-white truncate tracking-tight">{user.username}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${
                          user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 
                          user.membershipStatus === 'member' ? 'bg-emerald-500/20 text-emerald-400' : 
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {user.role === 'admin' ? '核心管理员' : user.membershipStatus === 'member' ? '正式成员' : '试用节点'}
                        </span>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-1 pt-4 border-t border-white/10">
                    <div className="text-[10px] text-[var(--text-muted)] truncate font-mono opacity-50 px-2 mb-3">
                      {user.email}
                    </div>
                    
                    <button onClick={() => { setShowPasswordModal(true); setShowUserPopover(false); }} className="w-full flex items-center gap-3 text-[11px] font-bold text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all py-2.5 px-3 rounded-xl text-left">
                      <Key size={16} className="text-blue-500" /> 更新访问密钥
                    </button>

                    <button onClick={handleSwitchAccount} className="w-full flex items-center gap-3 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 transition-all py-2.5 px-3 rounded-xl text-left">
                      <RefreshCw size={16} /> 切换身份登录
                    </button>

                    <button onClick={handleLogout} className="w-full flex items-center gap-3 text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all py-2.5 px-3 rounded-xl text-left">
                      <LogOut size={16} /> 注销会话并退出
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--bg-main)]">
        <header className="h-16 border-b border-[var(--glass-border)] flex items-center justify-between px-8 bg-[var(--bg-main)]/50 backdrop-blur-3xl shrink-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black tracking-widest text-[var(--text-muted)] uppercase">神经指挥枢纽</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">
              <Activity size={12} className="animate-pulse" /> 矩阵内核已同步
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[10px] font-bold text-[var(--text-muted)]">Matrix Node ID: <span className="text-blue-400">#AF-{user.username.toUpperCase()}</span></div>
          </div>
        </header>

        {activeTab === 'admin' ? (
          <AdminDashboard />
        ) : activeTab === 'config' ? (
          <div className="flex-1 overflow-hidden">
             <AgentConfigPanel configs={agents} onUpdate={(role, config) => setAgents(prev => ({ ...prev, [role]: config }))} />
          </div>
        ) : project ? (
          <div className="flex-1 flex overflow-hidden p-6 gap-6">
            <div className="w-72 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
              <div className="glass-panel p-6 rounded-3xl border-[var(--glass-border)] space-y-6">
                <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">节点运行轨迹</h2>
                <div className="space-y-3">
                  {Object.values(AgentRole).map((role) => {
                    const step = project.steps[role];
                    const isActive = project.currentStep === role;
                    const isDone = step?.status === StepStatus.APPROVED;
                    
                    return (
                      <div key={role} className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${isActive ? 'bg-blue-600/10 border-blue-500/40 shadow-xl' : isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[var(--glass-border)] border-[var(--glass-border)] opacity-40'}`}>
                        <div className={`w-8 h-8 rounded-lg ${ROLE_COLORS[role]} text-white flex items-center justify-center`}>
                          {ROLE_ICONS[role]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-white truncate">{role}</div>
                          <div className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                            {step?.status || '待机中'}
                          </div>
                        </div>
                        {isDone && <ShieldCheck size={16} className="text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 h-full glass-panel rounded-[2.5rem] border-[var(--glass-border)] overflow-hidden">
              <ResultDisplay project={project} onAccept={handleAccept} onFeedback={handleFeedback} onFinalEvaluation={handleFinalProjectEvaluation} isProcessing={isProcessing} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden">
            <div className="max-w-4xl w-full space-y-12 text-center z-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--glass-border)] border border-[var(--glass-border)] rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-bounce">
                  <Sparkles size={14} /> AI AGENT SOFTWARE FACTORY
                </div>
                <h1 className="text-7xl font-black text-white leading-tight tracking-tight">
                  一句话合成<br />
                  <span className="gradient-text">神经级全栈应用</span>
                </h1>
                <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto font-medium leading-relaxed">
                  通过多 Agent 深度协作，将模糊的软件愿景在数分钟内转化为高保真交互、稳健架构及可运行成品。
                </p>
              </div>

              <div className="w-full max-w-3xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                <div className="relative bg-[var(--panel-bg)] border border-[var(--glass-border)] p-1.5 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl">
                  <textarea className="w-full bg-transparent border-none rounded-3xl p-10 text-xl focus:ring-0 outline-none h-56 resize-none text-white font-medium placeholder:text-[var(--text-muted)]" placeholder="请详细描述您的软件构想..." value={inputReq} onChange={(e) => setInputReq(e.target.value)} />
                  <div className="p-4 flex justify-end">
                    <button onClick={() => inputReq && createNewProject(inputReq)} className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl flex items-center gap-4 shadow-2xl transition-all active:scale-95 group">
                      <Rocket size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 激活工厂内核
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-3xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center"><ShieldEllipsis size={20}/></div>
                  <h3 className="text-xl font-black text-white">重置访问密钥</h3>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                <input type="password" placeholder="原始密钥" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500" />
                <input type="password" placeholder="新密钥设置" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500" />
              </div>
              {pwdError && <div className="text-xs text-red-400 font-bold px-2">{pwdError}</div>}
              <button onClick={handleChangePassword} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">确认重写神经权重</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
