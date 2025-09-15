#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 批量修复API URL配置...');

// 需要修复的文件列表
const filesToFix = [
  'client/src/UserProfile.js',
  'client/src/FileUploader.js',
  'client/src/AdminPanel.js',
  'client/src/MyCollection.js',
  'client/src/Art.js',
  'client/src/Activity.js'
];

// 需要添加的import语句
const importStatement = "import { buildApiUrl, buildFileUrl } from './utils/apiUrl';\n";

// 替换模式
const replacements = [
  {
    // 替换 fetch 请求中的API URL
    pattern: /fetch\(`\$\{process\.env\.REACT_APP_API_URL \|\| 'http:\/\/localhost:5000'\}\/api\/([^`]+)`\)/g,
    replacement: (match, endpoint) => `fetch(buildApiUrl('/api/${endpoint}'))`
  },
  {
    // 替换其他API调用
    pattern: /`\$\{process\.env\.REACT_APP_API_URL \|\| 'http:\/\/localhost:5000'\}\/api\/([^`]+)`/g,
    replacement: (match, endpoint) => `buildApiUrl('/api/${endpoint}')`
  },
  {
    // 替换复杂的API URL构建
    pattern: /const apiUrl = process\.env\.REACT_APP_API_URL \|\|[\s\S]*?:\s*'http:\/\/localhost:5000'\);/g,
    replacement: '// API URL now handled by buildApiUrl()'
  },
  {
    // 替换文件URL构建
    pattern: /apiBaseUrl=\{process\.env\.REACT_APP_API_URL \|\| 'http:\/\/localhost:5000'\}/g,
    replacement: 'apiBaseUrl={buildApiUrl()}'
  }
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // 检查是否已经导入了工具函数
  if (!content.includes("from './utils/apiUrl'")) {
    // 找到第一个import语句的位置
    const importMatch = content.match(/^import.*$/m);
    if (importMatch) {
      const insertIndex = importMatch.index + importMatch[0].length;
      content = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
      modified = true;
    }
  }
  
  // 应用替换规则
  replacements.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 已修复: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  无需修复: ${filePath}`);
    return false;
  }
}

// 执行修复
let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 修复完成！共修复了 ${fixedCount} 个文件`);
console.log('\n📋 接下来需要：');
console.log('1. 重新构建前端: cd client && npm run build');
console.log('2. 提交更改: git add . && git commit -m "修复API URL配置"');
console.log('3. 推送到远程: git push origin main');
