// 本地存储管理工具
import { STORAGE_KEYS } from './constants';

export const storage = {
  // 获取数据
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`获取存储数据失败: ${key}`, error);
      return defaultValue;
    }
  },

  // 设置数据
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`设置存储数据失败: ${key}`, error);
      return false;
    }
  },

  // 删除数据
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除存储数据失败: ${key}`, error);
      return false;
    }
  },

  // 清空所有数据
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('清空存储数据失败', error);
      return false;
    }
  }
};

// 用户数据管理
export const userStorage = {
  // 获取用户信息
  getProfile() {
    return storage.get(STORAGE_KEYS.USER_PROFILE);
  },

  // 保存用户信息
  saveProfile(profile) {
    return storage.set(STORAGE_KEYS.USER_PROFILE, profile);
  },

  // 检查用户是否已登录
  isLoggedIn() {
    const profile = this.getProfile();
    return profile && profile.name && profile.class;
  },

  // 获取用户ID
  getUserId() {
    const profile = this.getProfile();
    return profile?.userId || null;
  },

  // 检查是否为管理员
  isAdmin() {
    const profile = this.getProfile();
    return profile?.isAdmin || false;
  }
};

// 点赞和收藏数据管理
export const interactionStorage = {
  // 获取点赞列表
  getLikedIds(type = 'art') {
    const key = type === 'art' ? STORAGE_KEYS.LIKED_ART_IDS : STORAGE_KEYS.LIKED_ACTIVITY_IDS;
    return storage.get(key, []);
  },

  // 设置点赞列表
  setLikedIds(ids, type = 'art') {
    const key = type === 'art' ? STORAGE_KEYS.LIKED_ART_IDS : STORAGE_KEYS.LIKED_ACTIVITY_IDS;
    return storage.set(key, ids);
  },

  // 添加点赞
  addLike(id, type = 'art') {
    const likedIds = this.getLikedIds(type);
    if (!likedIds.includes(id)) {
      this.setLikedIds([...likedIds, id], type);
    }
  },

  // 移除点赞
  removeLike(id, type = 'art') {
    const likedIds = this.getLikedIds(type);
    this.setLikedIds(likedIds.filter(likedId => likedId !== id), type);
  },

  // 检查是否已点赞
  isLiked(id, type = 'art') {
    const likedIds = this.getLikedIds(type);
    return likedIds.includes(id);
  },

  // 获取收藏列表
  getFavoriteIds(type = 'art') {
    const key = type === 'art' ? STORAGE_KEYS.FAVORITE_ART_IDS : STORAGE_KEYS.FAVORITE_ACTIVITY_IDS;
    return storage.get(key, []);
  },

  // 设置收藏列表
  setFavoriteIds(ids, type = 'art') {
    const key = type === 'art' ? STORAGE_KEYS.FAVORITE_ART_IDS : STORAGE_KEYS.FAVORITE_ACTIVITY_IDS;
    return storage.set(key, ids);
  },

  // 添加收藏
  addFavorite(id, type = 'art') {
    const favoriteIds = this.getFavoriteIds(type);
    if (!favoriteIds.includes(id)) {
      this.setFavoriteIds([...favoriteIds, id], type);
    }
  },

  // 移除收藏
  removeFavorite(id, type = 'art') {
    const favoriteIds = this.getFavoriteIds(type);
    this.setFavoriteIds(favoriteIds.filter(favId => favId !== id), type);
  },

  // 检查是否已收藏
  isFavorited(id, type = 'art') {
    const favoriteIds = this.getFavoriteIds(type);
    return favoriteIds.includes(id);
  }
};
