
import { User, InvitationCode, PaymentOrder, PaymentConfig, MembershipStatus, BuiltInEngineConfig } from '../types';

const USERS_KEY = 'autoforge_users_v3';
const SESSION_KEY = 'autoforge_current_user_v3';
const CODES_KEY = 'autoforge_invitation_codes_v3';
const ORDERS_KEY = 'autoforge_payment_orders_v3';
const CONFIG_KEY = 'autoforge_payment_config_v3';
const ENGINE_CONFIG_KEY = 'autoforge_engine_config_v3';

const neuralHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash).toString(16);
};

// Initial setup
if (!localStorage.getItem(USERS_KEY)) {
  const adminUser: User = {
    username: 'admin',
    email: 'admin@autoforge.ai',
    password: neuralHash('Lulu1990'),
    role: 'admin',
    activatedCode: 'SYSTEM-ROOT',
    membershipStatus: 'member',
    expiryDate: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000, 
    createdAt: Date.now()
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
}

if (!localStorage.getItem(CODES_KEY)) {
  const initialCodes: InvitationCode[] = [
    { code: 'AF-TRIAL-7DAYS-001', usedBy: null, createdAt: Date.now() },
    { code: 'AF-NEURAL-KEY-888', usedBy: null, createdAt: Date.now() }
  ];
  localStorage.setItem(CODES_KEY, JSON.stringify(initialCodes));
}

if (!localStorage.getItem(CONFIG_KEY)) {
  const defaultConfig: PaymentConfig = {
    alipayEnabled: true,
    wechatEnabled: true,
    alipayQr: '', 
    wechatQr: '', 
    price: 199
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultConfig));
}

// 确保默认引擎为 Gemini
if (!localStorage.getItem(ENGINE_CONFIG_KEY)) {
  const defaultEngine: BuiltInEngineConfig = {
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-3-flash-preview',
    apiKey: ''
  };
  localStorage.setItem(ENGINE_CONFIG_KEY, JSON.stringify(defaultEngine));
}

export const authService = {
  validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  getInvitationCodes: (): InvitationCode[] => JSON.parse(localStorage.getItem(CODES_KEY) || '[]'),
  getOrders: (): PaymentOrder[] => JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'),
  getPaymentConfig: (): PaymentConfig => JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'),
  getBuiltInEngineConfig: (): BuiltInEngineConfig => JSON.parse(localStorage.getItem(ENGINE_CONFIG_KEY) || '{}'),

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data || data === 'undefined' || data === 'null') return null;
    try {
      const user: User = JSON.parse(data);
      const allUsers = authService.getUsers();
      const dbUser = allUsers.find(u => u.username === user.username);
      if (!dbUser) return null;

      if (dbUser.role === 'user' && dbUser.expiryDate && Date.now() > dbUser.expiryDate) {
        dbUser.membershipStatus = 'expired';
      }
      return dbUser;
    } catch (e) {
      return null;
    }
  },

  register: (username: string, email: string, password: string): User => {
    if (!username || !password) throw new Error('请输入完整的身份凭证');
    if (!authService.validateEmail(email)) throw new Error('无效的邮箱格式');
    const users = authService.getUsers();
    if (users.find(u => u.username === username)) throw new Error('用户名已被占用');
    if (users.find(u => u.email === email)) throw new Error('邮箱已注册');

    const newUser: User = {
      username,
      email,
      password: neuralHash(password),
      role: 'user',
      activatedCode: null,
      membershipStatus: 'trial',
      expiryDate: null,
      createdAt: Date.now()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    return newUser;
  },

  login: (username: string, password: string): User => {
    const users = authService.getUsers();
    const user = users.find(u => (u.username === username || u.email === username) && u.password === neuralHash(password));
    if (!user) throw new Error('访问密钥或用户名不正确');
    
    if (user.role === 'user' && user.expiryDate && Date.now() > user.expiryDate) {
      user.membershipStatus = 'expired';
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.clear();
  },

  changePassword: (oldPassword: string, newPassword: string): void => {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('未建立有效的神经连接');
    
    const allUsers = authService.getUsers();
    const index = allUsers.findIndex(u => u.username === user.username);
    
    if (allUsers[index].password !== neuralHash(oldPassword)) {
      throw new Error('旧密钥验证失败');
    }

    allUsers[index].password = neuralHash(newPassword);
    localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
    localStorage.setItem(SESSION_KEY, JSON.stringify(allUsers[index]));
  },

  activate: (code: string): User => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('未建立有效会话');
    const codes = authService.getInvitationCodes();
    const codeObj = codes.find(c => c.code === code);
    if (!codeObj || codeObj.usedBy) throw new Error('激活码无效或已被其他神经节点占用');

    const updatedCodes = codes.map(c => c.code === code ? { ...c, usedBy: currentUser.username } : c);
    localStorage.setItem(CODES_KEY, JSON.stringify(updatedCodes));

    const allUsers = authService.getUsers();
    const expiryDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const updatedUser: User = { ...currentUser, activatedCode: code, membershipStatus: 'trial', expiryDate };
    
    localStorage.setItem(USERS_KEY, JSON.stringify(allUsers.map(u => u.username === currentUser.username ? updatedUser : u)));
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  processPayment: (method: 'alipay' | 'wechat'): void => {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('未建立有效会话');
    const config = authService.getPaymentConfig();
    const orders = authService.getOrders();
    const newOrder: PaymentOrder = {
      id: 'ORD-' + Date.now(),
      username: user.username,
      amount: config.price,
      method,
      status: 'pending',
      timestamp: Date.now()
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders, newOrder]));
  },

  admin_updateConfig: (config: PaymentConfig) => localStorage.setItem(CONFIG_KEY, JSON.stringify(config)),
  admin_updateEngineConfig: (config: BuiltInEngineConfig) => localStorage.setItem(ENGINE_CONFIG_KEY, JSON.stringify(config)),
  
  admin_confirmOrder: (orderId: string) => {
    const orders = authService.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('订单不存在');
    if (orders[orderIndex].status === 'completed') return;

    const order = orders[orderIndex];
    order.status = 'completed';
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    const allUsers = authService.getUsers();
    const userIndex = allUsers.findIndex(u => u.username === order.username);
    if (userIndex !== -1) {
      const newExpiry = Date.now() + 365 * 24 * 60 * 60 * 1000;
      allUsers[userIndex].membershipStatus = 'member';
      allUsers[userIndex].expiryDate = newExpiry;
      localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
    }
  },

  admin_rejectOrder: (orderId: string) => {
    const orders = authService.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  },

  admin_addUser: (user: Partial<User>) => {
    const users = authService.getUsers();
    if (users.find(u => u.username === user.username)) throw new Error('用户名已存在');
    const newUser: User = {
      username: user.username!,
      email: user.email!,
      password: neuralHash(user.password || '123456'),
      role: user.role || 'user',
      activatedCode: user.activatedCode || 'ADMIN-MANUAL',
      membershipStatus: user.membershipStatus || 'member',
      expiryDate: user.expiryDate || (Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: Date.now()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  },

  admin_updateUser: (username: string, updates: Partial<User>) => {
    const users = authService.getUsers();
    const updated = users.map(u => {
      if (u.username === username) {
        const newUser = { ...u, ...updates };
        if (updates.password) newUser.password = neuralHash(updates.password);
        return newUser;
      }
      return u;
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  },

  admin_deleteUser: (username: string) => {
    if (username === 'admin') return;
    localStorage.setItem(USERS_KEY, JSON.stringify(authService.getUsers().filter(u => u.username !== username)));
  },

  admin_addCode: (code: string) => {
    const codes = authService.getInvitationCodes();
    localStorage.setItem(CODES_KEY, JSON.stringify([...codes, { code, usedBy: null, createdAt: Date.now() }]));
  },

  admin_importUsers: (users: User[]) => {
    if (Array.isArray(users)) {
       localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } else {
       throw new Error("导入的数据格式不正确");
    }
  }
};
