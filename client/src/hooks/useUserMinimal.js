// 最简用户管理Hook
import { useState, useEffect } from 'react';

export const useUserMinimal = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载用户信息
  useEffect(() => {
    try {
      // 从localStorage获取用户信息
      const profile = localStorage.getItem('userProfile');
      if (profile) {
        const userData = JSON.parse(profile);
        setUserInfo(userData);
        setIsLoggedIn(true);
        setIsAdmin(userData.isAdmin || false);
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
    setIsLoggedIn(true);
    
    // 保存到localStorage
    try {
      localStorage.setItem('userProfile', JSON.stringify(updatedUserInfo));
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  };

  // 登出
  const logout = () => {
    setUserInfo(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('userProfile');
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
    logout,
    hasPermission,
    // 为了兼容现有代码，添加这些别名
    name: userInfo?.name || '',
    class: userInfo?.class || '',
    avatar: userInfo?.avatar || '',
    userId: userInfo?.userId || '',
  };
};
