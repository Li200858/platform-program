// 测试反馈功能
const testFeedback = async () => {
  console.log('🔧 测试反馈功能...');
  
  const baseUrl = 'http://localhost:5000';
  
  // 测试反馈提交
  const testFeedbackData = {
    content: "网站功能很强大，界面也很美观，希望能增加更多的互动功能。这是一个测试反馈。",
    category: "其他",
    authorName: "测试2",
    authorClass: "高三(1)班",
    authorAvatar: ""
  };
  
  try {
    console.log('📝 提交测试反馈...');
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testFeedbackData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 反馈提交成功:', data);
    } else {
      const error = await response.text();
      console.log('❌ 反馈提交失败:', error);
    }
  } catch (error) {
    console.log('❌ 反馈提交错误:', error.message);
  }
  
  // 测试获取反馈列表
  try {
    console.log('📋 获取反馈列表...');
    const response = await fetch(`${baseUrl}/api/admin/feedback`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 反馈列表获取成功:', data.length, '条反馈');
    } else {
      const error = await response.text();
      console.log('❌ 反馈列表获取失败:', error);
    }
  } catch (error) {
    console.log('❌ 反馈列表获取错误:', error.message);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  testFeedback();
}

module.exports = testFeedback;
