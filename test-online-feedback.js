// 测试线上反馈功能
const testOnlineFeedback = async () => {
  console.log('🌐 测试线上反馈功能...');
  
  const baseUrl = 'https://platform-program-production.up.railway.app';
  
  // 测试反馈提交
  const testFeedbackData = {
    content: "这是线上测试反馈，网站功能很强大！",
    category: "其他",
    authorName: "测试用户",
    authorClass: "测试班级",
    authorAvatar: ""
  };
  
  try {
    console.log('📝 提交线上测试反馈...');
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testFeedbackData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 线上反馈提交成功:', data);
    } else {
      const error = await response.text();
      console.log('❌ 线上反馈提交失败:', error);
    }
  } catch (error) {
    console.log('❌ 线上反馈提交错误:', error.message);
  }
  
  // 测试获取反馈列表
  try {
    console.log('📋 获取线上反馈列表...');
    const response = await fetch(`${baseUrl}/api/admin/feedback`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 线上反馈列表获取成功:', data.length, '条反馈');
    } else {
      const error = await response.text();
      console.log('❌ 线上反馈列表获取失败:', error);
    }
  } catch (error) {
    console.log('❌ 线上反馈列表获取错误:', error.message);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  testOnlineFeedback();
}

module.exports = testOnlineFeedback;
