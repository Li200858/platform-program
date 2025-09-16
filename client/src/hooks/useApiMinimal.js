// 最简API调用Hook
import { useState, useCallback } from 'react';
import { buildApiUrl } from '../utils/apiUrl';

export const useApiMinimal = () => {
  const [loading, setLoading] = useState(false);

  // 通用API调用函数
  const callApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    try {
      const url = buildApiUrl(endpoint);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索API
  const search = {
    search: (query) => callApi(`/search?q=${encodeURIComponent(query)}`),
  };

  // 用户API
  const user = {
    checkAdmin: (userName) => callApi(`/user/${userName}/admin`),
  };

  return {
    loading,
    search,
    user,
  };
};
