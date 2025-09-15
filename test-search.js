const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-program', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./server/models/User');

async function testSearch() {
  try {
    console.log('🔍 测试用户搜索功能...');
    
    // 1. 查看所有用户
    const allUsers = await User.find({}).select('name email class role isAdmin');
    console.log(`\n📊 数据库中总共有 ${allUsers.length} 个用户:`);
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - 班级: ${user.class || '未知'} - 角色: ${user.role} - 管理员: ${user.isAdmin}`);
    });
    
    // 2. 测试搜索功能
    const searchQueries = ['李', 'admin', 'test', 'user'];
    
    for (const query of searchQueries) {
      console.log(`\n🔍 搜索 "${query}":`);
      const searchRegex = new RegExp(query, 'i');
      const results = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('name email class role isAdmin');
      
      console.log(`找到 ${results.length} 个结果:`);
      results.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - 班级: ${user.class || '未知'}`);
      });
    }
    
    // 3. 测试API端点
    console.log('\n🌐 测试API端点...');
    const express = require('express');
    const app = express();
    
    // 模拟API调用
    const testApiSearch = async (query) => {
      const searchRegex = new RegExp(query, 'i');
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('name email class role isAdmin')
      .limit(20)
      .sort({ createdAt: -1 });
      
      return users.map(user => ({
        name: user.name,
        email: user.email || '',
        class: user.class || '未知',
        role: user.role || 'user',
        isAdmin: user.isAdmin || false
      }));
    };
    
    const apiResults = await testApiSearch('李');
    console.log('API搜索结果:', apiResults);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSearch();
