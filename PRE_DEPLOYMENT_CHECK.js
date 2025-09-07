#!/usr/bin/env node

/**
 * 网站上线前检查脚本
 * 检查所有必要的文件和配置
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始网站上线前检查...\n');

// 检查项目
const checks = [
  {
    name: '部署包目录',
    path: 'deploy-package',
    type: 'directory',
    required: true
  },
  {
    name: 'Netlify配置',
    path: 'deploy-package/netlify.toml',
    type: 'file',
    required: true
  },
  {
    name: '前端构建文件',
    path: 'deploy-package/index.html',
    type: 'file',
    required: true
  },
  {
    name: '静态资源目录',
    path: 'deploy-package/static',
    type: 'directory',
    required: true
  },
  {
    name: 'Netlify函数目录',
    path: 'deploy-package/netlify/functions',
    type: 'directory',
    required: true
  }
];

// 必需的函数文件
const requiredFunctions = [
  'login.js',
  'register.js',
  'env-check.js',
  'users.js',
  'pending-content.js',
  'review-content.js',
  'user-profile.js',
  'search.js',
  'upload.js',
  'feedback.js',
  'art.js',
  'study.js',
  'activity.js',
  'crosscampus.js'
];

let allPassed = true;

// 执行检查
console.log('📋 检查基本文件结构...');
checks.forEach(check => {
  const fullPath = path.join(__dirname, check.path);
  const exists = fs.existsSync(fullPath);
  const isCorrectType = exists && (
    (check.type === 'file' && fs.statSync(fullPath).isFile()) ||
    (check.type === 'directory' && fs.statSync(fullPath).isDirectory())
  );
  
  if (exists && isCorrectType) {
    console.log(`✅ ${check.name}: 存在`);
  } else {
    console.log(`❌ ${check.name}: 缺失或类型错误`);
    if (check.required) allPassed = false;
  }
});

console.log('\n📋 检查Netlify函数...');
const functionsPath = path.join(__dirname, 'deploy-package/netlify/functions');
if (fs.existsSync(functionsPath)) {
  const functionFiles = fs.readdirSync(functionsPath).filter(f => f.endsWith('.js'));
  
  requiredFunctions.forEach(func => {
    if (functionFiles.includes(func)) {
      console.log(`✅ ${func}: 存在`);
    } else {
      console.log(`❌ ${func}: 缺失`);
      allPassed = false;
    }
  });
  
  console.log(`\n📊 函数统计: ${functionFiles.length}/${requiredFunctions.length} 个必需函数`);
} else {
  console.log('❌ Netlify函数目录不存在');
  allPassed = false;
}

// 检查配置文件内容
console.log('\n📋 检查配置文件...');
const netlifyTomlPath = path.join(__dirname, 'deploy-package/netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  const content = fs.readFileSync(netlifyTomlPath, 'utf8');
  
  if (content.includes('[build]')) {
    console.log('✅ netlify.toml: 包含构建配置');
  } else {
    console.log('❌ netlify.toml: 缺少构建配置');
    allPassed = false;
  }
  
  if (content.includes('[functions]')) {
    console.log('✅ netlify.toml: 包含函数配置');
  } else {
    console.log('❌ netlify.toml: 缺少函数配置');
    allPassed = false;
  }
  
  if (content.includes('[[redirects]]')) {
    console.log('✅ netlify.toml: 包含重定向配置');
  } else {
    console.log('❌ netlify.toml: 缺少重定向配置');
    allPassed = false;
  }
}

// 检查前端文件
console.log('\n📋 检查前端文件...');
const indexHtmlPath = path.join(__dirname, 'deploy-package/index.html');
if (fs.existsSync(indexHtmlPath)) {
  const content = fs.readFileSync(indexHtmlPath, 'utf8');
  
  if (content.includes('<div id="root">')) {
    console.log('✅ index.html: 包含React根元素');
  } else {
    console.log('❌ index.html: 缺少React根元素');
    allPassed = false;
  }
  
  if (content.includes('static/js/') && content.includes('static/css/')) {
    console.log('✅ index.html: 包含静态资源引用');
  } else {
    console.log('❌ index.html: 缺少静态资源引用');
    allPassed = false;
  }
}

// 检查package.json
console.log('\n📋 检查依赖配置...');
const packageJsonPath = path.join(__dirname, 'deploy-package/package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies) {
      const requiredDeps = ['mongoose', 'bcryptjs', 'jsonwebtoken'];
      requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep]) {
          console.log(`✅ ${dep}: 已配置`);
        } else {
          console.log(`❌ ${dep}: 未配置`);
          allPassed = false;
        }
      });
    } else {
      console.log('❌ package.json: 缺少dependencies');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ package.json: 格式错误');
    allPassed = false;
  }
}

// 总结
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 所有检查通过！网站可以上线了！');
  console.log('\n📋 下一步操作:');
  console.log('1. 准备MongoDB数据库');
  console.log('2. 设置环境变量');
  console.log('3. 部署到Netlify');
  console.log('4. 测试功能');
} else {
  console.log('❌ 检查未通过，请修复上述问题后再试');
  console.log('\n🔧 需要修复的问题:');
  console.log('- 检查缺失的文件');
  console.log('- 验证配置文件格式');
  console.log('- 确保所有依赖正确');
}
console.log('='.repeat(50));

process.exit(allPassed ? 0 : 1);
