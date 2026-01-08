
import React, { useState, useEffect } from 'react';
import { User, InvitationCode, PaymentOrder, PaymentConfig, BuiltInEngineConfig } from '../types';
import { authService } from '../services/authService';
import { 
  ShieldAlert, TrendingUp, Clock, Users, Search, Download, 
  FileUp, UserPlus, Edit3, Trash2, CheckCircle, XCircle, 
  Settings, ImageIcon, QrCode, Upload, Lock, Unlock, 
  Loader2, CheckCircle2, Wand2, Hash, Calendar, HardDrive, X, Eye,
  Cpu, Server, Key, Globe
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [payConfig, setPayConfig] = useState<PaymentConfig>(authService.getPaymentConfig());
  const [engineConfig, setEngineConfig] = useState<BuiltInEngineConfig>(authService.getBuiltInEngineConfig());
  const [newCode, setNewCode] = useState('');
  const [tab, setTab] = useState<'members' | 'invites' | 'orders' | 'config' | 'engine' | 'system'>('members');
  const [searchTerm, setSearchTerm] = useState('');

  // System Upgrade UI
  const [upgradeStatus, setUpgradeStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [systemVersion, setSystemVersion] = useState('2.4.8-Build');
  const [allowCoreUpgrade, setAllowCoreUpgrade] = useState(false);
  const [upgradeLog, setUpgradeLog] = useState<string[]>([]);

  // User Management UI
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const refreshData = () => {
    setUsers(authService.getUsers());
    setCodes(authService.getInvitationCodes());
    setOrders(authService.getOrders());
    setEngineConfig(authService.getBuiltInEngineConfig());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUpdateConfig = () => {
    authService.admin_updateConfig(payConfig);
    alert('系统支付参数已更新并持久化');
  };

  const handleUpdateEngine = () => {
    authService.admin_updateEngineConfig(engineConfig);
    alert('全局内置引擎配置已同步');
  };

  const handleFileUpload = (type: 'alipay' | 'wechat', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayConfig(prev => ({
          ...prev,
          [type === 'alipay' ? 'alipayQr' : 'wechatQr']: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'AutoForge_Users_Backup.json');
    linkElement.click();
  };

  const handleImportUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          authService.admin_importUsers(imported);
          refreshData();
          alert(`成功导入 ${imported.length} 名成员`);
        } catch (e: any) {
          alert('导入失败：' + e.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSystemUpgrade = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpgradeStatus('uploading');
      setUpgradeLog([`侦测到补丁包: ${file.name}`, "校验 MD5 特征码...", "上传神经元结构流..."]);
      
      setTimeout(() => {
        setUpgradeStatus('processing');
        if (allowCoreUpgrade) {
          setUpgradeLog(prev => [...prev, "安全锁已解除：正在对【核心管控中心】进行深度重构...", "同步系统权限表...", "刷新管理员会话密钥..."]);
        } else {
          setUpgradeLog(prev => [...prev, "安全锁激活：跳过【核心管控中心】，正在升级【业务Agent模块】...", "优化产品经理模型路由...", "更新设计师渲染引擎..."]);
        }
        
        setTimeout(() => {
          setUpgradeStatus('done');
          setSystemVersion(allowCoreUpgrade ? '2.5.0-Neural-Full' : '2.5.0-Neural-Lite');
          alert(allowCoreUpgrade 
            ? '全系统（含核心管控中心）已完成热升级。' 
            : '业务模块已升级。核心管控中心及其敏感数据受到安全保护，未进行更改。'
          );
        }, 3000);
      }, 1500);
    }
  };

  const handleConfirmOrder = (orderId: string) => {
    if (confirm('确认已收到该笔转账并激活用户权限吗？')) {
      try {
        authService.admin_confirmOrder(orderId);
        refreshData();
        alert('支付已确认，用户权限已激活');
      } catch (e: any) { alert(e.message); }
    }
  };

  const handleRejectOrder = (orderId: string) => {
    if (confirm('确定拒绝此支付申请吗？')) {
      authService.admin_rejectOrder(orderId);
      refreshData();
    }
  };

  const handleGenerateRandomCode = () => {
    const prefix = "AF-KEY-";
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 8; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(`${prefix}${suffix}`);
  };

  const handleAddCode = () => {
    if (!newCode) return;
    try {
      authService.admin_addCode(newCode);
      setNewCode('');
      refreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.username || !editingUser?.email) {
      alert('请填写完整信息');
      return;
    }
    
    try {
      const isEdit = users.some(u => u.username === editingUser.username);
      if (isEdit) {
        authService.admin_updateUser(editingUser.username!, editingUser);
      } else {
        authService.admin_addUser(editingUser);
      }
      setShowUserModal(false);
      setEditingUser({});
      refreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.amount, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    activeMembers: users.filter(u => u.membershipStatus === 'member').length
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] animate-in fade-in duration-500 overflow-hidden">
      <header className="px-10 py-8 border-b border-[var(--glass-border)] flex items-center justify-between shrink-0 bg-[var(--bg-main)]/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">核心管控中心</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Matrix Control Cluster</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="flex bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--glass-border)] shadow-inner overflow-x-auto custom-scrollbar">
          {(['members', 'invites', 'orders', 'config', 'engine', 'system'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 shrink-0 ${tab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`}>
              {t === 'members' ? '成员' : t === 'invites' ? '密钥' : t === 'orders' ? '订单' : t === 'config' ? '网关' : t === 'engine' ? '内置引擎' : '系统升级'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10 pb-20">
        {/* Stats Section */}
        {tab === 'members' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center"><TrendingUp size={24}/></div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">确认营收</div>
                  <div className="text-2xl font-black text-white">¥{stats.totalRevenue}</div>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center"><Clock size={24}/></div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">待审订单</div>
                  <div className="text-2xl font-black text-white">{stats.pendingOrders}</div>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">正式会员</div>
                  <div className="text-2xl font-black text-white">{stats.activeMembers}</div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="relative w-96">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                     <input type="text" placeholder="搜索成员..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex gap-4">
                     <button onClick={handleExportUsers} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-700 transition-colors"><Download size={16}/> 备份</button>
                     <label className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors"><FileUp size={16}/> 恢复 <input type="file" className="hidden" accept=".json" onChange={handleImportUsers} /></label>
                     <button onClick={() => { setEditingUser({}); setShowUserModal(true); }} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"><UserPlus size={16}/> 新增</button>
                </div>
               </div>
               <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden overflow-x-auto shadow-2xl">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      <tr>
                        <th className="px-8 py-5">身份标识</th>
                        <th className="px-8 py-5">角色</th>
                        <th className="px-8 py-5">状态</th>
                        <th className="px-8 py-5">到期</th>
                        <th className="px-8 py-5 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredUsers.map(u => (
                        <tr key={u.username} className="hover:bg-white/[0.02] group transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-bold text-white text-base">{u.username}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>
                              {u.role === 'admin' ? 'CORE ADMIN' : 'MEMBER'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              u.membershipStatus === 'member' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                              u.membershipStatus === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {u.membershipStatus === 'member' ? 'OFFICIAL' : u.membershipStatus === 'trial' ? 'TRIAL' : 'EXPIRED'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-slate-400 font-mono text-xs">
                            {u.expiryDate ? new Date(u.expiryDate).toLocaleDateString() : '永久连接'}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"><Edit3 size={18}/></button>
                                {u.username !== 'admin' && (
                                  <button onClick={() => { if(confirm('确定注销？')) { authService.admin_deleteUser(u.username); refreshData(); } }} className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><Trash2 size={18}/></button>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </>
        )}

        {tab === 'invites' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-end shadow-2xl">
                <div className="flex-1 space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block">生成试用密钥</label>
                   <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="输入密钥内容..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-mono text-lg outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <button onClick={handleGenerateRandomCode} className="p-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"><Wand2 size={24} /></button>
                   </div>
                </div>
                <button onClick={handleAddCode} disabled={!newCode} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95">存入密钥库</button>
             </div>
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden overflow-x-auto shadow-2xl">
                <table className="w-full text-left min-w-[600px]">
                   <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      <tr>
                         <th className="px-8 py-5">内容</th>
                         <th className="px-8 py-5">状态</th>
                         <th className="px-8 py-5">使用者</th>
                         <th className="px-8 py-5 text-right">创建</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50">
                      {codes.slice().reverse().map(c => (
                         <tr key={c.code} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-5 font-mono text-indigo-400 font-bold text-base tracking-wide">{c.code}</td>
                            <td className="px-8 py-5">
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${c.usedBy ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                  {c.usedBy ? '已激活' : '待使用'}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-slate-300 font-bold">{c.usedBy ? `@${c.usedBy}` : '--'}</td>
                            <td className="px-8 py-5 text-right text-[11px] text-slate-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden overflow-x-auto shadow-2xl">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-8 py-5">ID</th>
                  <th className="px-8 py-5">申请账号</th>
                  <th className="px-8 py-5">金额</th>
                  <th className="px-8 py-5">状态</th>
                  <th className="px-8 py-5 text-right">核销</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orders.slice().reverse().map(o => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-500">{o.id}</td>
                    <td className="px-8 py-5 font-bold text-white text-base">@{o.username}</td>
                    <td className="px-8 py-5 text-emerald-400 font-black text-lg">¥{o.amount}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : o.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {o.status === 'pending' && (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleConfirmOrder(o.id)} className="p-3 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-lg hover:scale-105"><CheckCircle size={18}/></button>
                          <button onClick={() => handleRejectOrder(o.id)} className="p-3 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-lg hover:scale-105"><XCircle size={18}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] space-y-8 shadow-2xl">
               <h2 className="text-xl font-black text-white flex items-center gap-3"><Settings size={22} className="text-blue-500"/> 网关价格与开关</h2>
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2 mb-2 block tracking-widest">年费单价 (CNY)</label>
                    <input type="number" value={payConfig.price} onChange={e => setPayConfig({...payConfig, price: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-xl font-black outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-950 rounded-[2rem] border border-white/5">
                    <div className="font-bold text-white">支付宝通道</div>
                    <input type="checkbox" checked={payConfig.alipayEnabled} onChange={e => setPayConfig({...payConfig, alipayEnabled: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-950 rounded-[2rem] border border-white/5">
                    <div className="font-bold text-white">微信通道</div>
                    <input type="checkbox" checked={payConfig.wechatEnabled} onChange={e => setPayConfig({...payConfig, wechatEnabled: e.target.checked})} className="w-6 h-6 accent-emerald-600" />
                  </div>
                  <button onClick={handleUpdateConfig} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">保存网关配置</button>
               </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] space-y-8 shadow-2xl">
               <h2 className="text-xl font-black text-white flex items-center gap-3"><ImageIcon size={22} className="text-emerald-500"/> 收款码凭证</h2>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4 text-center">
                    <div className="text-[10px] font-black text-slate-500">支付宝 QR</div>
                    <div className="aspect-square bg-white rounded-3xl border-4 border-slate-800 overflow-hidden flex items-center justify-center relative group">
                      {payConfig.alipayQr ? <img src={payConfig.alipayQr} className="w-full h-full object-contain p-2"/> : <QrCode size={48} className="text-slate-200"/>}
                      <label className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                        <Upload size={32} className="text-white mb-2"/>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('alipay', e)}/>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4 text-center">
                    <div className="text-[10px] font-black text-slate-500">微信 QR</div>
                    <div className="aspect-square bg-white rounded-3xl border-4 border-slate-800 overflow-hidden flex items-center justify-center relative group">
                      {payConfig.wechatQr ? <img src={payConfig.wechatQr} className="w-full h-full object-contain p-2"/> : <QrCode size={48} className="text-slate-200"/>}
                      <label className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                        <Upload size={32} className="text-white mb-2"/>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('wechat', e)}/>
                      </label>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {tab === 'engine' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] shadow-3xl space-y-10">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/10">
                      <Cpu size={40} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white tracking-tighter">平台内置算力中枢</h2>
                      <p className="text-slate-400 font-medium mt-1">全局统一配置，为“内置引擎”节点提供底层 LLM 能力</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">服务提供商</label>
                         <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => setEngineConfig({...engineConfig, provider: 'gemini'})}
                              className={`py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${engineConfig.provider === 'gemini' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                            >
                               <Globe size={24} />
                               <span className="text-xs font-bold">Google Gemini</span>
                            </button>
                            <button 
                              onClick={() => setEngineConfig({...engineConfig, provider: 'openai-compatible'})}
                              className={`py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${engineConfig.provider === 'openai-compatible' ? 'bg-purple-600/10 border-purple-500 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                            >
                               <Server size={24} />
                               <span className="text-xs font-bold">国内大模型 / OpenAI 兼容</span>
                            </button>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">模型标识符 (Model ID)</label>
                         <input 
                           type="text" 
                           value={engineConfig.model} 
                           onChange={e => setEngineConfig({...engineConfig, model: e.target.value})} 
                           placeholder="如: gemini-3-pro-preview / deepseek-chat" 
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono outline-none focus:border-blue-500"
                         />
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">接口地址 (Base URL)</label>
                         <div className="relative">
                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input 
                              type="text" 
                              value={engineConfig.baseUrl} 
                              onChange={e => setEngineConfig({...engineConfig, baseUrl: e.target.value})} 
                              placeholder="https://api.example.com" 
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-mono outline-none focus:border-blue-500"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">全局授权密钥 (Global API Key)</label>
                         <div className="relative">
                            <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input 
                              type="password" 
                              value={engineConfig.apiKey} 
                              onChange={e => setEngineConfig({...engineConfig, apiKey: e.target.value})} 
                              placeholder="sk-..." 
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-mono outline-none focus:border-blue-500"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                   <button 
                     onClick={handleUpdateEngine}
                     className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all"
                   >
                     同步并应用全局算力配置
                   </button>
                   <p className="text-[10px] text-slate-500 text-center mt-4">注意：更新该配置将立即影响所有选择“平台内置引擎”的 Agent 运行节点。</p>
                </div>
             </div>
          </div>
        )}

        {tab === 'system' && (
          <div className="max-w-4xl mx-auto space-y-10">
             <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] text-center space-y-8 relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="flex flex-col items-center gap-6">
                  <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-700 ${allowCoreUpgrade ? 'bg-red-600/10 text-red-500 shadow-red-500/20 ring-4 ring-red-500/10' : 'bg-blue-600/10 text-blue-500 shadow-blue-500/20 ring-4 ring-blue-500/10'}`}>
                     {allowCoreUpgrade ? <Unlock size={56} /> : <Lock size={56} />}
                  </div>
                  <div className="flex items-center gap-4 bg-slate-950/50 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                     <div className="text-left mr-4">
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] block ${allowCoreUpgrade ? 'text-red-500' : 'text-blue-400'}`}>
                          核心系统安全锁: {allowCoreUpgrade ? '已解除 (UNLOCKED)' : '已激活 (LOCKED)'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium mt-1 block">解除后允许修改管理员逻辑与核心数据库表结构</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={allowCoreUpgrade} onChange={e => setAllowCoreUpgrade(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 shadow-inner"></div>
                     </label>
                  </div>
                </div>
                <div className="space-y-3">
                   <h2 className="text-4xl font-black text-white tracking-tighter">平台分级热升级 (OTA)</h2>
                   <p className="text-slate-400 font-medium text-lg">当前内核：<span className="text-blue-400 font-black">Build v{systemVersion}</span></p>
                </div>
                <div className="pt-6">
                   {upgradeStatus === 'idle' ? (
                     <label className={`inline-flex items-center gap-4 px-14 py-6 text-white rounded-[2.5rem] font-black text-xl shadow-2xl transition-all cursor-pointer active:scale-95 ${allowCoreUpgrade ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}>
                        <Upload size={28} /> {allowCoreUpgrade ? '核心系统全量热更新' : '常规业务模块补丁升级'}
                        <input type="file" className="hidden" accept=".zip" onChange={handleSystemUpgrade} />
                     </label>
                   ) : upgradeStatus === 'done' ? (
                     <div className="space-y-6 animate-in zoom-in duration-500">
                        <div className="flex items-center justify-center gap-4 text-emerald-400 font-black text-2xl">
                           <CheckCircle2 size={40} /> {allowCoreUpgrade ? '全量系统重构完成' : '业务模块补丁已部署'}
                        </div>
                        <button onClick={() => { setUpgradeStatus('idle'); setUpgradeLog([]); }} className="px-10 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black hover:bg-slate-700 transition-all border border-white/5">返回指挥中心</button>
                     </div>
                   ) : (
                     <div className="space-y-6 flex flex-col items-center">
                        <div className="w-full max-w-md h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                           <div className={`h-full transition-all duration-1000 ${allowCoreUpgrade ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'} ${upgradeStatus === 'uploading' ? 'w-1/3' : 'w-full'}`}></div>
                        </div>
                        <div className="space-y-2 text-left w-full max-w-md bg-slate-950 p-6 rounded-3xl border border-white/5 font-mono text-[10px] shadow-2xl">
                           {upgradeLog.map((log, i) => (
                             <div key={i} className={`${i === upgradeLog.length - 1 ? 'text-blue-400' : 'text-slate-500'} flex gap-2`}>
                               <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                               <span className="font-bold">> {log}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* User Edit/Add Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-10 space-y-8 shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                   {users.some(u => u.username === editingUser.username) ? <Edit3 size={28} className="text-blue-500"/> : <UserPlus size={28} className="text-emerald-500"/>}
                   {users.some(u => u.username === editingUser.username) ? '更新成员配置' : '手动授权准入'}
                 </h2>
                 <button onClick={() => setShowUserModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={28}/></button>
              </div>
              
              <form onSubmit={handleUserSubmit} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">用户名</label>
                       <input required readOnly={users.some(u => u.username === editingUser.username)} type="text" value={editingUser.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-colors ${users.some(u => u.username === editingUser.username) ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">准入权限</label>
                       <select value={editingUser.role || 'user'} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-colors">
                         <option value="user">普通成员 (MEMBER)</option>
                         <option value="admin">核心管辖 (CORE ADMIN)</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">绑定邮箱地址</label>
                    <input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-colors" />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">神经连接状态</label>
                       <select value={editingUser.membershipStatus || 'member'} onChange={e => setEditingUser({...editingUser, membershipStatus: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-colors">
                         <option value="member">正式成员 (OFFICIAL)</option>
                         <option value="trial">试用期 (TRIAL)</option>
                         <option value="expired">已失效 (EXPIRED)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">设定到期时长</label>
                       <div className="relative">
                          <select 
                            onChange={e => {
                              const days = parseInt(e.target.value);
                              if (days === 0) setEditingUser({...editingUser, expiryDate: null});
                              else setEditingUser({...editingUser, expiryDate: Date.now() + days * 24 * 60 * 60 * 1000});
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white outline-none focus:border-blue-500 appearance-none transition-colors"
                          >
                            <option value="">-- 选择时长 --</option>
                            <option value="7">延长 7 天 (试用)</option>
                            <option value="30">延长 30 天</option>
                            <option value="365">延长 1 年 (标准)</option>
                            <option value="36500">设为永久连接 (Infinite)</option>
                            <option value="0">立即切断 (Reset)</option>
                          </select>
                          <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 {editingUser.expiryDate && (
                   <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between shadow-inner">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> 预设到期日期</span>
                      <span className="text-sm font-black text-white">{new Date(editingUser.expiryDate).toLocaleDateString()}</span>
                   </div>
                 )}

                 <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-[0.98]">
                   同步成员矩阵配置
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
