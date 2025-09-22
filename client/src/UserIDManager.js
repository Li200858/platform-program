import React, { createContext, useContext, useState, useEffect } from 'react';

const UserIDContext = createContext();

export const useUserID = () => {
  const context = useContext(UserIDContext);
  if (!context) {
    throw new Error('useUserID must be used within a UserIDProvider');
  }
  return context;
};

export const UserIDProvider = ({ children }) => {
  const [userID, setUserID] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 生成唯一用户ID（纯数字）
  const generateUserID = () => {
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1000000);
    return `${timestamp}${randomPart}`;
  };

  // 从localStorage获取或创建用户ID
  const initializeUserID = () => {
    try {
      let storedUserID = localStorage.getItem('user_unique_id');
      
      if (!storedUserID) {
        // 如果没有存储的ID，生成一个新的
        storedUserID = generateUserID();
        localStorage.setItem('user_unique_id', storedUserID);
        console.log('新用户ID已生成:', storedUserID);
      } else {
        console.log('使用现有用户ID:', storedUserID);
      }
      
      setUserID(storedUserID);
    } catch (error) {
      console.error('初始化用户ID失败:', error);
      // 如果localStorage不可用，生成一个临时ID
      const tempID = generateUserID();
      setUserID(tempID);
    } finally {
      setIsLoading(false);
    }
  };

  // 导入用户ID（用于跨设备同步）
  const importUserID = async (importedID) => {
    if (!importedID || typeof importedID !== 'string') {
      throw new Error('无效的用户ID格式');
    }

    try {
      localStorage.setItem('user_unique_id', importedID);
      setUserID(importedID);
      console.log('用户ID已导入:', importedID);
      
      // 尝试从服务器获取用户信息
      try {
        const api = (await import('./api')).default;
        const userData = await api.user.getByID(importedID);
        
        // 如果获取到用户信息，保存到本地存储
        if (userData && userData.name && userData.class) {
          const userProfile = {
            name: userData.name,
            class: userData.class
          };
          localStorage.setItem('user_profile', JSON.stringify(userProfile));
          localStorage.setItem('name_edited', 'true'); // 标记为已编辑，避免重复填写
          
          // 触发storage事件，通知其他组件更新
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'user_profile',
            newValue: JSON.stringify(userProfile),
            oldValue: null
          }));
          
          console.log('用户信息已自动导入:', userProfile);
        }
      } catch (apiError) {
        console.log('无法从服务器获取用户信息，用户需要手动填写:', apiError.message);
        // 不抛出错误，让用户手动填写信息
      }
      
      return true;
    } catch (error) {
      console.error('导入用户ID失败:', error);
      throw error;
    }
  };

  // 导出用户ID（用于跨设备同步）
  const exportUserID = () => {
    if (!userID) {
      throw new Error('没有可导出的用户ID');
    }
    return userID;
  };

  // 重置用户ID
  const resetUserID = () => {
    try {
      localStorage.removeItem('user_unique_id');
      const newID = generateUserID();
      localStorage.setItem('user_unique_id', newID);
      setUserID(newID);
      console.log('用户ID已重置:', newID);
      return newID;
    } catch (error) {
      console.error('重置用户ID失败:', error);
      throw error;
    }
  };


  useEffect(() => {
    initializeUserID();
  }, []);

  const value = {
    userID,
    isLoading,
    importUserID,
    exportUserID,
    resetUserID
  };

  return (
    <UserIDContext.Provider value={value}>
      {children}
    </UserIDContext.Provider>
  );
};

export default UserIDProvider;
