
import React, { useState, useEffect } from 'react';
import { User, PaymentConfig } from '../types';
import { authService } from '../services/authService';
import { 
  BrainCircuit, Lock, User as UserIcon, ShieldCheck, Key, 
  ArrowRight, Loader2, Mail, CreditCard, CheckCircle2, QrCode, Smartphone,
  X, UserRoundPen, Clock
} from 'lucide-react';

interface Props {
  onAuthenticated: (user: User) => void;
}

const AuthBarrier: React.FC<Props> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'activate' | 'forgot' | 'payment' | 'pending'>('auth');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat' | null>(null);
  const [payConfig, setPayConfig] = useState<PaymentConfig>(authService.getPaymentConfig());

  useEffect(() => {
    if (step === 'payment') {
      setPayConfig(authService.getPaymentConfig());
    }
  }, [step]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      let user: User;
      if (isLogin) {
        user = authService.login(username, password);
      } else {
        user = authService.register(username, email, password);
        user = authService.login(username, password);
      }

      if (user.membershipStatus === 'member') {
        onAuthenticated(user);
      } else if (user.membershipStatus === 'expired') {
        setTempUser(user);
        setStep('payment');
      } else if (user.activatedCode) {
        onAuthenticated(user);
      } else {
        setTempUser(user);
        setStep('activate');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = authService.activate(code);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!payMethod) return;
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      authService.processPayment(payMethod);
      setStep('pending');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'pending') {
    return (
      <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="w-full max-w-lg bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 p-14 rounded-[3rem] shadow-2xl space-y-8">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 animate-pulse">
            <Clock size={40} />
          </div>
          <h1 className="text-3xl font-black text-white">支付验证中</h1>
          <p className="text-slate-400 text-sm">您的支付申请已成功提交到神经工厂。管理员将在 24 小时内完成流水核对并激活您的正式会员节点。请稍后再登录查看。</p>
          <button onClick={() => { authService.logout(); window.location.reload(); }} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black">返回登录界面</button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    const activeQr = payMethod === 'alipay' ? payConfig.alipayQr : payConfig.wechatQr;
    return (
      <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="w-full max-w-lg bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8">
           <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-xl shadow-amber-500/10">
              <CreditCard size={40} />
           </div>
           <h1 className="text-3xl font-black text-white">激活正式权限</h1>
           <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="text-left">
                 <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">正式会员 (1 年有效)</div>
                 <div className="text-2xl font-black text-white">¥{payConfig.price}</div>
              </div>
              <ShieldCheck className="text-blue-500" size={32}/>
           </div>

           {!payMethod ? (
              <div className="grid grid-cols-2 gap-4">
                {payConfig.alipayEnabled && (
                  <button onClick={() => setPayMethod('alipay')} className="bg-white/5 hover:bg-blue-600/20 border border-white/10 p-6 rounded-2xl transition-all">
                    <Smartphone className="mx-auto mb-3 text-blue-400" />
                    <span className="text-xs font-black text-white">支付宝支付</span>
                  </button>
                )}
                {payConfig.wechatEnabled && (
                  <button onClick={() => setPayMethod('wechat')} className="bg-white/5 hover:bg-emerald-600/20 border border-white/10 p-6 rounded-2xl transition-all">
                    <Smartphone className="mx-auto mb-3 text-emerald-400" />
                    <span className="text-xs font-black text-white">微信支付</span>
                  </button>
                )}
              </div>
           ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="w-48 h-48 bg-white p-3 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                    {activeQr ? <img src={activeQr} className="w-full h-full object-contain" /> : <QrCode size={48} className="text-slate-200" />}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setPayMethod(null)} className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm">返回</button>
                  <button onClick={confirmPayment} disabled={isLoading} className={`flex-1 py-4 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 ${payMethod === 'alipay' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                    {isLoading ? <Loader2 className="animate-spin" size={18}/> : '我已支付，提交审核'}
                  </button>
                </div>
              </div>
           )}
           <button onClick={() => { authService.logout(); window.location.reload(); }} className="text-slate-500 hover:text-white text-xs font-black flex items-center justify-center gap-2 mx-auto mt-4"><UserRoundPen size={14}/> 退出登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-lg relative group">
        <div className="relative bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 p-14 rounded-[3rem] shadow-2xl space-y-10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 mb-6">
              <BrainCircuit size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">{isLogin ? '神经工厂准入' : '申请加入矩阵'}</h1>
            <p className="text-slate-400 font-medium text-sm">通过加密隧道连接到 AutoForge AI 集群</p>
          </div>

          <form onSubmit={step === 'auth' ? handleAuth : handleActivate} className="space-y-5">
            {step === 'auth' && (
              <div className="space-y-4">
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required type="text" placeholder="用户名" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                {!isLogin && (
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input required type="email" placeholder="绑定邮箱" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                )}
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required type="password" placeholder="访问密码" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
            )}

            {step === 'activate' && (
              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required autoFocus type="text" placeholder="输入 16 位激活码" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
                </div>
              </div>
            )}

            {error && <div className="text-xs py-3 px-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400">{error}</div>}

            <button disabled={isLoading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 transition-all active:scale-95 group">
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  {step === 'auth' ? (isLogin ? '建立连接' : '完成注册') : '激活节点'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col gap-4 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-slate-500 hover:text-blue-400 text-xs font-bold transition-colors">{isLogin ? '申请加入矩阵' : '已有身份？建立连接'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthBarrier;
