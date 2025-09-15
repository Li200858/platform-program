#!/usr/bin/env node

// 修复图片URL的脚本
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('🔧 修复图片URL问题...');
console.log('目标URL:', RAILWAY_URL);

// 获取所有艺术作品数据
function getAllArt() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/art`;
    console.log('📊 获取艺术作品数据:', url);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 获取艺术作品数据成功');
          console.log('数据条数:', result.length);
          resolve(result);
        } catch (error) {
          console.log('❌ 获取艺术作品数据失败:');
          console.log('原始响应:', data);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ 获取艺术作品数据请求失败:', error.message);
      reject(error);
    });
  });
}

// 分析图片URL问题
function analyzeImageUrls(artData) {
  console.log('');
  console.log('🔍 分析图片URL问题...');
  
  let localUrls = 0;
  let cloudinaryUrls = 0;
  let invalidUrls = 0;
  
  artData.forEach((art, index) => {
    if (art.media && art.media.length > 0) {
      art.media.forEach(mediaUrl => {
        if (mediaUrl.startsWith('/uploads/')) {
          localUrls++;
          console.log(`- 作品 ${index + 1} (${art.title}): 本地路径 - ${mediaUrl}`);
        } else if (mediaUrl.startsWith('http')) {
          cloudinaryUrls++;
          console.log(`- 作品 ${index + 1} (${art.title}): Cloudinary URL - ${mediaUrl}`);
        } else {
          invalidUrls++;
          console.log(`- 作品 ${index + 1} (${art.title}): 无效URL - ${mediaUrl}`);
        }
      });
    }
  });
  
  console.log('');
  console.log('📊 统计结果:');
  console.log('- 本地路径数量:', localUrls);
  console.log('- Cloudinary URL数量:', cloudinaryUrls);
  console.log('- 无效URL数量:', invalidUrls);
  
  return { localUrls, cloudinaryUrls, invalidUrls };
}

// 测试图片访问
function testImageAccess(artData) {
  console.log('');
  console.log('🧪 测试图片访问...');
  
  const testPromises = [];
  
  artData.forEach((art, index) => {
    if (art.media && art.media.length > 0) {
      art.media.forEach(mediaUrl => {
        if (mediaUrl.startsWith('/uploads/')) {
          const fullUrl = `${RAILWAY_URL}${mediaUrl}`;
          testPromises.push(
            new Promise((resolve) => {
              https.get(fullUrl, (res) => {
                if (res.statusCode === 200) {
                  console.log(`✅ 图片可访问: ${mediaUrl}`);
                } else {
                  console.log(`❌ 图片不可访问: ${mediaUrl} (状态码: ${res.statusCode})`);
                }
                resolve();
              }).on('error', (error) => {
                console.log(`❌ 图片访问错误: ${mediaUrl} - ${error.message}`);
                resolve();
              });
            })
          );
        }
      });
    }
  });
  
  return Promise.all(testPromises);
}

// 运行分析
async function runAnalysis() {
  console.log('='.repeat(60));
  console.log('开始分析图片URL问题...');
  console.log('='.repeat(60));
  
  try {
    const artData = await getAllArt();
    const analysis = analyzeImageUrls(artData);
    await testImageAccess(artData);
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎯 分析完成！');
    console.log('='.repeat(60));
    
    console.log('');
    console.log('💡 解决方案:');
    if (analysis.localUrls > 0) {
      console.log('1. 旧数据使用本地路径，但Railway上没有这些文件');
      console.log('2. 建议：重新上传这些图片，或者将旧数据迁移到Cloudinary');
      console.log('3. 新上传的图片应该自动使用Cloudinary');
    }
    
    if (analysis.cloudinaryUrls > 0) {
      console.log('4. 部分数据已使用Cloudinary，这是正确的');
    }
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ 分析失败');
    console.log('错误:', error.message);
    console.log('='.repeat(60));
  }
}

runAnalysis();
