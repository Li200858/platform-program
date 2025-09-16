// 设置测试用户数据
const setupTestUser = () => {
  const testUser = {
    name: "测试2",
    class: "高三(1)班",
    userId: "test_user_2",
    avatar: "",
    isAdmin: true
  };
  
  // 保存到localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('userProfile', JSON.stringify(testUser));
    console.log('✅ 测试用户数据已设置:', testUser);
    
    // 刷新页面以应用新数据
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    console.log('测试用户数据:', testUser);
  }
  
  return testUser;
};

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
  setupTestUser();
}

module.exports = setupTestUser;
