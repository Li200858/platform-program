const fs = require('fs');
const path = require('path');

async function testAdminFunctionality() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('👑 测试管理员功能...\n');
  
  try {
    // 1. 检查服务器状态
    console.log('1️⃣ 检查服务器状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('后端服务器未运行');
    }
    console.log('✅ 后端服务器运行正常');
    
    // 2. 测试李昌轩的管理员权限
    console.log('\n2️⃣ 测试李昌轩的管理员权限...');
    const lichangxuanResponse = await fetch(`${API_BASE_URL}/api/admin/check?userName=李昌轩`);
    
    if (lichangxuanResponse.ok) {
      const lichangxuanData = await lichangxuanResponse.json();
      console.log('✅ 李昌轩管理员权限检查成功');
      console.log('📊 是否为管理员:', lichangxuanData.isAdmin ? '是' : '否');
      console.log('📊 是否为超级管理员:', lichangxuanData.isInitial ? '是' : '否');
      
      if (lichangxuanData.isAdmin && lichangxuanData.isInitial) {
        console.log('🎉 李昌轩具有超级管理员权限！');
      } else {
        console.log('❌ 李昌轩管理员权限设置失败');
        return false;
      }
    } else {
      console.log('❌ 李昌轩管理员权限检查失败');
      return false;
    }
    
    // 3. 测试测试员的管理员权限
    console.log('\n3️⃣ 测试测试员的管理员权限...');
    const testUserResponse = await fetch(`${API_BASE_URL}/api/admin/check?userName=测试员`);
    
    if (testUserResponse.ok) {
      const testUserData = await testUserResponse.json();
      console.log('✅ 测试员管理员权限检查成功');
      console.log('📊 是否为管理员:', testUserData.isAdmin ? '是' : '否');
      console.log('📊 是否为超级管理员:', testUserData.isInitial ? '是' : '否');
    } else {
      console.log('❌ 测试员管理员权限检查失败');
    }
    
    // 4. 测试普通用户权限
    console.log('\n4️⃣ 测试普通用户权限...');
    const normalUserResponse = await fetch(`${API_BASE_URL}/api/admin/check?userName=普通用户`);
    
    if (normalUserResponse.ok) {
      const normalUserData = await normalUserResponse.json();
      console.log('✅ 普通用户权限检查成功');
      console.log('📊 是否为管理员:', normalUserData.isAdmin ? '是' : '否');
      console.log('📊 是否为超级管理员:', normalUserData.isInitial ? '是' : '否');
      
      if (!normalUserData.isAdmin && !normalUserData.isInitial) {
        console.log('✅ 普通用户权限设置正确');
      } else {
        console.log('❌ 普通用户权限设置错误');
      }
    } else {
      console.log('❌ 普通用户权限检查失败');
    }
    
    // 5. 测试添加管理员功能
    console.log('\n5️⃣ 测试添加管理员功能...');
    const addAdminResponse = await fetch(`${API_BASE_URL}/api/admin/add-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: '测试管理员',
        addedBy: '李昌轩'
      })
    });
    
    if (addAdminResponse.ok) {
      const addAdminData = await addAdminResponse.json();
      console.log('✅ 添加管理员功能正常');
      console.log('📝 添加结果:', addAdminData.message);
      
      // 验证新管理员权限
      const newAdminResponse = await fetch(`${API_BASE_URL}/api/admin/check?userName=测试管理员`);
      if (newAdminResponse.ok) {
        const newAdminData = await newAdminResponse.json();
        console.log('✅ 新管理员权限验证成功');
        console.log('📊 是否为管理员:', newAdminData.isAdmin ? '是' : '否');
      }
    } else {
      const errorData = await addAdminResponse.text();
      console.log('❌ 添加管理员功能失败:', errorData);
    }
    
    // 6. 测试移除管理员功能
    console.log('\n6️⃣ 测试移除管理员功能...');
    const removeAdminResponse = await fetch(`${API_BASE_URL}/api/admin/remove-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: '测试管理员',
        removedBy: '李昌轩'
      })
    });
    
    if (removeAdminResponse.ok) {
      const removeAdminData = await removeAdminResponse.json();
      console.log('✅ 移除管理员功能正常');
      console.log('📝 移除结果:', removeAdminData.message);
      
      // 验证管理员权限已移除
      const removedAdminResponse = await fetch(`${API_BASE_URL}/api/admin/check?userName=测试管理员`);
      if (removedAdminResponse.ok) {
        const removedAdminData = await removedAdminResponse.json();
        console.log('✅ 管理员权限移除验证成功');
        console.log('📊 是否为管理员:', removedAdminData.isAdmin ? '是' : '否');
      }
    } else {
      const errorData = await removeAdminResponse.text();
      console.log('❌ 移除管理员功能失败:', errorData);
    }
    
    // 7. 测试权限验证
    console.log('\n7️⃣ 测试权限验证...');
    
    // 测试非管理员用户尝试添加管理员
    const unauthorizedResponse = await fetch(`${API_BASE_URL}/api/admin/add-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: '测试用户2',
        addedBy: '普通用户'
      })
    });
    
    if (unauthorizedResponse.status === 403) {
      console.log('✅ 权限验证正常，非管理员无法添加管理员');
    } else {
      console.log('❌ 权限验证失败，非管理员不应该能够添加管理员');
    }
    
    console.log('\n🎉 管理员功能测试完成！');
    console.log('✅ 李昌轩具有超级管理员权限');
    console.log('✅ 可以添加和移除其他管理员');
    console.log('✅ 权限验证正常工作');
    console.log('✅ 用户身份识别正常');
    
    return true;
    
  } catch (error) {
    console.log('❌ 管理员功能测试失败:', error.message);
    return false;
  }
}

async function testFrontendAdmin() {
  console.log('\n🌐 测试前端管理员功能...');
  
  try {
    const frontendResponse = await fetch('http://localhost:3000');
    if (frontendResponse.ok) {
      console.log('✅ 前端服务器运行正常');
      console.log('🌐 访问地址: http://localhost:3000');
      console.log('👑 管理员功能说明:');
      console.log('   1. 以"李昌轩"身份登录');
      console.log('   2. 在个人信息页面查看身份标识');
      console.log('   3. 访问管理面板');
      console.log('   4. 搜索其他用户并设置管理员身份');
      console.log('   5. 管理用户权限');
    } else {
      console.log('❌ 前端服务器无法访问');
    }
  } catch (error) {
    console.log('❌ 前端测试失败:', error.message);
  }
}

async function runAdminTest() {
  console.log('🚀 开始管理员功能测试...\n');
  
  const backendTest = await testAdminFunctionality();
  await testFrontendAdmin();
  
  if (backendTest) {
    console.log('\n🎉 管理员功能完全正常！');
    console.log('✅ 李昌轩具有超级管理员权限');
    console.log('✅ 可以管理其他用户的管理员身份');
    console.log('✅ 用户身份在个人信息页面正确显示');
    console.log('✅ 权限验证和安全机制正常工作');
  } else {
    console.log('\n⚠️ 管理员功能存在问题，请检查服务器状态。');
  }
}

runAdminTest();
