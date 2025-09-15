#!/usr/bin/env node

// 清理有问题的数据
const https = require('https');

const RAILWAY_URL = 'https://platform-program-production.up.railway.app';

console.log('🧹 清理有问题的数据...');

// 获取所有作品
function getAllArt() {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}/api/art`;
    console.log('📊 获取作品数据...');
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ 获取作品数据成功，共', result.length, '个作品');
          resolve(result);
        } catch (error) {
          console.log('❌ 获取作品数据失败:', error.message);
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// 检查文件是否存在
function checkFileExists(url) {
  return new Promise((resolve) => {
    const fullUrl = url.startsWith('http') ? url : `${RAILWAY_URL}${url}`;
    https.get(fullUrl, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// 删除作品
function deleteArt(artId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'platform-program-production.up.railway.app',
      port: 443,
      path: `/api/art/${artId}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 删除作品成功:', artId);
          resolve(true);
        } else {
          console.log('❌ 删除作品失败:', artId, '状态码:', res.statusCode);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ 删除请求失败:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  try {
    const arts = await getAllArt();
    
    console.log('🔍 检查每个作品的文件...');
    
    for (const art of arts) {
      console.log(`\n📝 检查作品: ${art.title || '无标题'} (ID: ${art._id})`);
      
      if (!art.media || art.media.length === 0) {
        console.log('  ⚠️  没有媒体文件，跳过');
        continue;
      }
      
      let hasValidFiles = false;
      
      for (const mediaUrl of art.media) {
        console.log(`  🔍 检查文件: ${mediaUrl}`);
        
        // 检查URL格式
        if (!mediaUrl.startsWith('/uploads/') && !mediaUrl.startsWith('http')) {
          console.log('    ❌ URL格式无效');
          continue;
        }
        
        // 检查文件扩展名
        const ext = mediaUrl.split('.').pop().toLowerCase();
        if (!ext || ext.length > 10) {
          console.log('    ❌ 文件扩展名无效');
          continue;
        }
        
        // 检查文件是否存在
        const exists = await checkFileExists(mediaUrl);
        if (exists) {
          console.log('    ✅ 文件存在');
          hasValidFiles = true;
        } else {
          console.log('    ❌ 文件不存在');
        }
      }
      
      if (!hasValidFiles) {
        console.log('  🗑️  删除无效作品...');
        await deleteArt(art._id);
      } else {
        console.log('  ✅ 作品有效，保留');
      }
    }
    
    console.log('\n🎉 数据清理完成！');
    
  } catch (error) {
    console.log('❌ 清理过程出错:', error.message);
  }
}

main();
