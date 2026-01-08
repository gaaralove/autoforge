
import React, { useState } from 'react';
import { AgentRole, AgentConfig, Integration, ModelEngine } from '../types';
import { 
  Zap, Plus, Trash2, Edit3, Cpu, 
  Database, Network, Pocket, 
  ShieldCheck, X, Terminal,
  Globe, Server, Key,
  ChevronDown,
  Box, Sparkles
} from 'lucide-react';

interface Props {
  configs: Record<AgentRole, AgentConfig>;
  onUpdate: (role: AgentRole, config: AgentConfig) => void;
}

const AgentConfigPanel: React.FC<Props> = ({ configs, onUpdate }) => {
  const [editingRole, setEditingRole] = React.useState<AgentRole | null>(null);

  // 输入临时状态
  const [tempSkill, setTempSkill] = useState('');
  const [tempMCP, setTempMCP] = useState('');
  const [showIntegForm, setShowIntegForm] = useState(false);
  const [integForm, setIntegForm] = useState<Partial<Integration>>({ type: 'API' });
  const [editingIntegId, setEditingIntegId] = useState<string | null>(null);

  const handleEngineChange = (role: AgentRole, engine: ModelEngine) => {
    onUpdate(role, { 
      ...configs[role], 
      engine, 
    });
  };

  const handleIntegSubmit = (role: AgentRole) => {
    if (!integForm.name || !integForm.url) return;
    const config = configs[role];
    let updatedIntegs = [...config.integrations];

    if (editingIntegId) {
      updatedIntegs = updatedIntegs.map(i => i.id === editingIntegId ? { ...i, ...integForm } as Integration : i);
    } else {
      updatedIntegs.push({ ...integForm, id: Date.now().toString() } as Integration);
    }

    onUpdate(role, { ...config, integrations: updatedIntegs });
    setShowIntegForm(false);
    setIntegForm({ type: 'API' });
    setEditingIntegId(null);
  };

  return (
    <div className="h-full w-full bg-slate-950 p-10 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        
        <div className="bg-gradient-to-br from-indigo-900/40 via-blue-900/20 to-slate-900/50 border border-indigo-500/30 p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3 text-indigo-400 font-black tracking-widest uppercase text-sm">
                <ShieldCheck size={20} />
                神经进化实验室
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">算力矩阵调度配置</h2>
              <p className="text-lg text-slate-400 leading-relaxed font-medium">
                各角色可选用“平台内置引擎”或“自定义大模型 API”。
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-3xl text-center min-w-[140px]">
              <span className="text-3xl font-black text-blue-500">{(Object.values(configs) as AgentConfig[]).reduce((acc: number, c: AgentConfig) => acc + (c.evolutionVersion || 0), 0)}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">累计进化次数</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10">
          {(Object.entries(configs) as [AgentRole, AgentConfig][]).map(([role, config]) => (
            <div key={role} className={`transition-all duration-500 rounded-[2.5rem] p-10 ${editingRole === role ? 'bg-slate-900 ring-2 ring-blue-500/50' : 'bg-slate-900/40 border border-slate-800'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white border ${config.engine === 'gemini' ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-purple-600/20 border-purple-500/30 text-purple-400'}`}>
                    {config.engine === 'gemini' ? <Sparkles size={32} /> : <Zap size={32} />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">{role}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${config.engine === 'gemini' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                        {config.engine === 'gemini' ? '平台内置引擎' : '自定义 API 节点'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingRole(editingRole === role ? null : role)}
                  className={`px-8 py-4 rounded-2xl font-black transition-all ${editingRole === role ? 'bg-slate-800 text-white shadow-inner' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                >
                  {editingRole === role ? '锁定配置' : '管理节点'}
                </button>
              </div>

              {editingRole === role && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 border-t border-slate-800 pt-10 animate-in fade-in zoom-in-95">
                  <div className="space-y-8">
                    {/* 引擎切换器 */}
                    <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6">
                      <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                        <Cpu size={18} /> 调度引擎选择
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => handleEngineChange(role, 'gemini')}
                          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${config.engine === 'gemini' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                        >
                          <Sparkles size={24} />
                          <span className="font-black text-sm text-center">平台内置引擎</span>
                        </button>
                        <button 
                          onClick={() => handleEngineChange(role, 'custom')}
                          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${config.engine === 'custom' ? 'bg-purple-600/10 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                        >
                          <Server size={24} />
                          <span className="font-black text-sm text-center">自定义 API</span>
                        </button>
                      </div>
                    </div>

                    {config.engine === 'custom' ? (
                      <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                          <Database size={18} /> 模型配置节点
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] text-slate-500 font-black uppercase mb-2 block">接口地址 (Base URL)</label>
                            <input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 outline-none focus:border-blue-500" value={config.baseUrl} onChange={e => onUpdate(role, { ...config, baseUrl: e.target.value })} placeholder="https://..." />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-black uppercase mb-2 block">授权密钥 (API Key)</label>
                            <div className="relative">
                              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                              <input type="password" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-12 py-3 text-sm font-mono text-slate-300 outline-none focus:border-blue-500" value={config.apiKey || ''} onChange={e => onUpdate(role, { ...config, apiKey: e.target.value })} placeholder="sk-..." />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-black uppercase mb-2 block">模型标识符 (Model ID)</label>
                            <input className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 outline-none focus:border-blue-500" value={config.model} onChange={e => onUpdate(role, { ...config, model: e.target.value })} placeholder="gpt-4 / deepseek-chat..." />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-900/10 border border-blue-500/20 p-8 rounded-[2rem] space-y-4 flex flex-col items-center text-center animate-in fade-in">
                         <ShieldCheck className="text-blue-400" size={40} />
                         <p className="text-sm font-bold text-blue-400">已接入平台集中管控引擎</p>
                         <p className="text-xs text-slate-500 leading-relaxed">该节点的底层算力、模型规格及安全策略均由【管控中心】全局统一调度，无需手动配置参数。</p>
                      </div>
                    )}

                    <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6">
                      <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                        <Zap size={18} /> 系统提示词 (Prompt)
                      </h4>
                      <textarea className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-5 text-sm h-48 outline-none text-slate-200 resize-none focus:border-indigo-500" value={config.systemPrompt} onChange={e => onUpdate(role, { ...config, systemPrompt: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6">
                      <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3">
                        <Network size={18} /> 专家技能 & 工具
                      </h4>
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase mb-2 block">核心技能库</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {config.skills.map((s, i) => (
                              <span key={i} className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center gap-2">
                                {s} <button onClick={() => onUpdate(role, { ...config, skills: config.skills.filter((_, idx) => idx !== i) })} className="text-slate-500 hover:text-red-400"><X size={12} /></button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" value={tempSkill} onChange={e => setTempSkill(e.target.value)} placeholder="输入技能..." onKeyDown={e => e.key === 'Enter' && tempSkill && (onUpdate(role, { ...config, skills: [...config.skills, tempSkill] }), setTempSkill(''))} />
                            <button className="p-2 bg-blue-600 rounded-lg text-white" onClick={() => tempSkill && (onUpdate(role, { ...config, skills: [...config.skills, tempSkill] }), setTempSkill(''))}><Plus size={16} /></button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase mb-2 block">集成外部能力 (Integrations)</label>
                          <div className="space-y-2">
                            {config.integrations.map(integ => (
                              <div key={integ.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <Box size={14} className="text-blue-400" />
                                  <span className="text-xs font-bold text-slate-300">{integ.name}</span>
                                </div>
                                <button onClick={() => onUpdate(role, { ...config, integrations: config.integrations.filter(i => i.id !== integ.id) })} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                              </div>
                            ))}
                            <button onClick={() => setShowIntegForm(true)} className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-[10px] text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all">+ 添加新集成</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showIntegForm && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 space-y-6">
              <h3 className="text-xl font-black text-white">配置第三方集成</h3>
              <div className="space-y-4">
                 <input placeholder="应用名称" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" value={integForm.name || ''} onChange={e => setIntegForm({...integForm, name: e.target.value})} />
                 <input placeholder="端点 URL" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" value={integForm.url || ''} onChange={e => setIntegForm({...integForm, url: e.target.value})} />
                 <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none" value={integForm.type} onChange={e => setIntegForm({...integForm, type: e.target.value as any})}>
                   <option value="API">Standard API</option>
                   <option value="Platform">External Platform</option>
                   <option value="MCP">MCP Toolset</option>
                 </select>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowIntegForm(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold">取消</button>
                 <button onClick={() => editingRole && handleIntegSubmit(editingRole)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold">确认保存</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AgentConfigPanel;
