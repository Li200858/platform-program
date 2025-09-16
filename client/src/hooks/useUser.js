// 用户管理Hook
import { useState, useEffect, useCallback } from 'react';
import { userStorage } from '../utils/storage';
import { validation } from '../utils/validation';
import { useApi } from './useApi';

export const useUser = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  // 加载用户信息
  const loadUserInfo = useCallback(() => {
    const profile = userStorage.getProfile();
    if (profile) {
      setUserInfo(profile);
      setIsLoggedIn(userStorage.isLoggedIn());
      setIsAdmin(userStorage.isAdmin());
    }
    setLoading(false);
  }, []);

  // 检查管理员状态
  const checkAdminStatus = useCallback(async (userName) => {
    if (!userName) return;
    
    try {
      const response = await api.user.checkAdmin(userName);
      const isAdminStatus = response.isAdmin || false;
      setIsAdmin(isAdminStatus);
      
      // 更新用户信息
      if (response.name && response.name !== userInfo?.name) {
        const updatedUserInfo = { ...userInfo, ...response };
        setUserInfo(updatedUserInfo);
        userStorage.saveProfile(updatedUserInfo);
      }
    } catch (error) {
      console.error('检查管理员状态失败:', error);
      setIsAdmin(false);
    }
  }, [api.user]);

  // 保存用户信息
  const saveUserInfo = useCallback(async (newUserInfo) => {
    // 验证用户信息
    const validationResult = validation.validateUser(newUserInfo);
    if (!validationResult.valid) {
      throw new Error(validationResult.message);
    }

    try {
      // 保存到本地存储
      userStorage.saveProfile(newUserInfo);
      setUserInfo(newUserInfo);
      setIsLoggedIn(true);
      
      // 保存到云端
      if (newUserInfo.userId) {
        await api.user.save(newUserInfo);
      }
      
      // 检查管理员状态
      await checkAdminStatus(newUserInfo.name);
      
      return newUserInfo;
    } catch (error) {
      console.error('保存用户信息失败:', error);
      throw error;
    }
  }, [api.user, checkAdminStatus]);

  // 更新用户信息
  const updateUserInfo = useCallback((updates) => {
    const updatedUserInfo = { ...userInfo, ...updates };
    setUserInfo(updatedUserInfo);
    userStorage.saveProfile(updatedUserInfo);
    
    // 如果更新了姓名，检查管理员状态
    if (updates.name && updates.name !== userInfo?.name) {
      checkAdminStatus(updates.name);
    }
  }, [userInfo, checkAdminStatus]);

  // 登出
  const logout = useCallback(() => {
    userStorage.remove('user_profile');
    setUserInfo(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  }, []);

  // 检查用户权限
  const hasPermission = useCallback((permission) => {
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
  }, [isLoggedIn, isAdmin]);

  // 获取用户显示名称
  const getDisplayName = useCallback(() => {
    return userInfo?.name || '未登录用户';
  }, [userInfo]);

  // 获取用户班级
  const getUserClass = useCallback(() => {
    return userInfo?.class || '未知班级';
  }, [userInfo]);

  // 获取用户头像
  const getUserAvatar = useCallback(() => {
    return userInfo?.avatar || '';
  }, [userInfo]);

  // 初始化
  useEffect(() => {
    loadUserInfo();
  }, []);

  // 当用户信息变化时，检查管理员状态
  useEffect(() => {
    if (userInfo?.name) {
      checkAdminStatus(userInfo.name);
    }
  }, [userInfo?.name, checkAdminStatus]);

  return {
    userInfo,
    isLoggedIn,
    isAdmin,
    loading,
    saveUserInfo,
    updateUserInfo,
    logout,
    hasPermission,
    getDisplayName,
    getUserClass,
    getUserAvatar,
    checkAdminStatus,
    // 为了兼容现有代码，添加这些别名
    name: userInfo?.name || '',
    class: userInfo?.class || '',
    avatar: userInfo?.avatar || '',
    userId: userInfo?.userId || '',
  };
};
