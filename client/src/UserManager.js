// 用户ID管理系统
class UserManager {
  static generateUserId() {
    // 生成一个唯一的用户ID，包含时间戳和随机字符串
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `user_${timestamp}_${randomStr}`;
  }

  static getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  static getUserProfile() {
    const profile = localStorage.getItem('user_profile');
    return profile ? JSON.parse(profile) : null;
  }

  static saveUserProfile(profile) {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }

  static exportUserData() {
    const userId = this.getUserId();
    const profile = this.getUserProfile();
    const likedIds = JSON.parse(localStorage.getItem('liked_art_ids') || '[]');
    const favoriteIds = JSON.parse(localStorage.getItem('favorite_art_ids') || '[]');

    // 导出完整的用户信息，包括姓名、班级等
    const exportData = {
      userId,
      ...profile, // 直接展开profile数据，包含name, class, avatar等
      likedIds,
      favoriteIds,
      exportTime: new Date().toISOString()
    };

    return exportData;
  }

  static importUserData(data) {
    try {
      // 如果数据直接包含用户信息（name, class等）
      if (data.name && data.class) {
        localStorage.setItem('user_profile', JSON.stringify(data));
        if (data.userId) {
          localStorage.setItem('user_id', data.userId);
        }
      } else if (data.profile) {
        // 如果数据包含profile字段
        localStorage.setItem('user_profile', JSON.stringify(data.profile));
        if (data.userId) {
          localStorage.setItem('user_id', data.userId);
        }
      }
      
      // 导入其他数据
      if (data.likedIds) {
        localStorage.setItem('liked_art_ids', JSON.stringify(data.likedIds));
      }
      if (data.favoriteIds) {
        localStorage.setItem('favorite_art_ids', JSON.stringify(data.favoriteIds));
      }
      return true;
    } catch (error) {
      console.error('导入用户数据失败:', error);
      return false;
    }
  }

  static downloadUserData() {
    const data = this.exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_data_${data.userId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static uploadUserData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (this.importUserData(data)) {
            resolve('用户数据导入成功！');
          } else {
            reject('用户数据格式错误');
          }
        } catch (error) {
          reject('文件格式错误');
        }
      };
      reader.onerror = () => reject('文件读取失败');
      reader.readAsText(file);
    });
  }
}

export default UserManager;
