// 简化版用户管理Hook
import { useState, useEffect } from 'react';
import { userStorage } from '../utils/storage';

export const useUserSimple = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载用户信息
  useEffect(() => {
    try {
      const profile = userStorage.getProfile();
      if (profile) {
        setUserInfo(profile);
        setIsLoggedIn(userStorage.isLoggedIn());
        setIsAdmin(userStorage.isAdmin());
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新用户信息
  const updateUserInfo = (updates) => {
    const updatedUserInfo = { ...userInfo, ...updates };
    setUserInfo(updatedUserInfo);
    userStorage.saveProfile(updatedUserInfo);
    
    // 更新登录状态
    if (updates.name && updates.class) {
      setIsLoggedIn(true);
    }
  };

  // 检查权限
  const hasPermission = (permission) => {
    if (!isLoggedIn) return false;
    
    switch (permission) {
      case 'admin':
        return isAdmin;
      case 'create':
        return isLoggedIn;
      case 'comment':
        return isLoggedIn;
      default:
        return false;
    }
  };

  return {
    userInfo,
    isLoggedIn,
    isAdmin,
    loading,
    updateUserInfo,
    hasPermission,
    // 为了兼容现有代码，添加这些别名
    name: userInfo?.name || '',
    class: userInfo?.class || '',
    avatar: userInfo?.avatar || '',
    userId: userInfo?.userId || '',
  };
};

