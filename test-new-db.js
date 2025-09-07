#!/usr/bin/env node

/**
 * 测试新MongoDB数据库连接脚本
 * 用于验证新创建的集群是否正常工作
 */

const mongoose = require('mongoose');

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection() {
  try {
    log('🔄 开始测试新数据库连接...', 'blue');
    
    // 检查环境变量
    if (!process.env.MONGODB_URI) {
      log('❌ MONGODB_URI 环境变量未设置', 'red');
      log('请设置环境变量: export MONGODB_URI="your_connection_string"', 'yellow');
      process.exit(1);
    }
    
    log('✅ 环境变量检查通过', 'green');
    log(`🔗 连接字符串: ${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`, 'blue');
    
    // 连接数据库
    log('🔄 正在连接数据库...', 'blue');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    log('✅ 数据库连接成功！', 'green');
    
    // 获取数据库信息
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // 获取服务器信息
    const serverInfo = await admin.serverStatus();
    log(`📊 MongoDB版本: ${serverInfo.version}`, 'blue');
    log(`📊 运行时间: ${Math.floor(serverInfo.uptime / 3600)}小时`, 'blue');
    
    // 列出所有集合
    const collections = await db.listCollections().toArray();
    log(`📊 数据库集合数量: ${collections.length}`, 'blue');
    
    if (collections.length > 0) {
      log('📋 现有集合:', 'blue');
      collections.forEach(collection => {
        log(`  - ${collection.name}`, 'blue');
      });
    } else {
      log('📋 数据库为空，这是正常的（新集群）', 'yellow');
    }
    
    // 测试基本操作
    log('🔄 测试基本数据库操作...', 'blue');
    
    // 创建测试集合
    const testCollection = db.collection('connection_test');
    
    // 插入测试文档
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: '连接测试成功'
    };
    
    await testCollection.insertOne(testDoc);
    log('✅ 插入操作测试成功', 'green');
    
    // 查询测试文档
    const foundDoc = await testCollection.findOne({ test: true });
    if (foundDoc) {
      log('✅ 查询操作测试成功', 'green');
    }
    
    // 删除测试文档
    await testCollection.deleteOne({ test: true });
    log('✅ 删除操作测试成功', 'green');
    
    // 断开连接
    await mongoose.disconnect();
    log('✅ 数据库连接已断开', 'green');
    
    log('\n🎉 所有测试通过！新数据库集群工作正常！', 'green');
    log('\n📋 下一步操作:', 'blue');
    log('1. 更新应用程序的环境变量', 'blue');
    log('2. 运行创始人设置脚本: node server/setup-founder.js', 'blue');
    log('3. 测试应用程序功能', 'blue');
    
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`, 'red');
    
    if (error.name === 'MongoServerError') {
      log('\n🔧 可能的解决方案:', 'yellow');
      log('1. 检查MongoDB Atlas集群状态', 'yellow');
      log('2. 验证数据库用户权限', 'yellow');
      log('3. 检查网络访问设置', 'yellow');
      log('4. 确认连接字符串格式', 'yellow');
    }
    
    if (error.name === 'MongoNetworkError') {
      log('\n🔧 网络连接问题:', 'yellow');
      log('1. 检查网络连接', 'yellow');
      log('2. 验证IP白名单设置', 'yellow');
      log('3. 检查防火墙设置', 'yellow');
    }
    
    process.exit(1);
  }
}

// 运行测试
testConnection();
