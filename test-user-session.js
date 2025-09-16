// 模拟用户登录和设置管理员权限
const userInfo = {
  name: "测试2",
  class: "高三(1)班",
  userId: "test_user_2",
  avatar: "",
  isAdmin: true
};

// 保存到localStorage模拟登录
if (typeof window !== 'undefined') {
  localStorage.setItem('userProfile', JSON.stringify(userInfo));
  console.log('✅ 用户信息已设置:', userInfo);
} else {
  console.log('用户信息设置:', userInfo);
}

module.exports = userInfo;
