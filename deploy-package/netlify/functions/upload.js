// 注意：Netlify Functions不支持multer和文件系统操作
// 这里提供一个简化的文件上传处理方案

exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // 检查请求体
    if (!event.body) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '请求体不能为空' }) 
      };
    }

    // 检查Content-Type
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: '只支持multipart/form-data格式' }) 
      };
    }

    // 生成一个模拟的文件URL
    // 注意：在生产环境中，建议使用云存储服务如Cloudinary、AWS S3等
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    // 根据Content-Type返回不同的演示URL
    let mockFileUrl;
    let fileExtension;
    let fileType;
    
    if (contentType.includes('image/')) {
      mockFileUrl = `https://picsum.photos/400/300?random=${timestamp}`;
      fileExtension = 'jpg';
      fileType = '图片';
    } else if (contentType.includes('video/')) {
      mockFileUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`;
      fileExtension = 'mp4';
      fileType = '视频';
    } else if (contentType.includes('audio/')) {
      mockFileUrl = `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`;
      fileExtension = 'mp3';
      fileType = '音频';
    } else if (contentType.includes('application/pdf')) {
      mockFileUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
      fileExtension = 'pdf';
      fileType = 'PDF文档';
    } else if (contentType.includes('application/msword') || contentType.includes('wordprocessingml')) {
      mockFileUrl = `https://file-examples.com/storage/fe68c8b8b8b8b8b8b8b8b8b/sample.docx`;
      fileExtension = 'docx';
      fileType = 'Word文档';
    } else if (contentType.includes('spreadsheetml')) {
      mockFileUrl = `https://file-examples.com/storage/fe68c8b8b8b8b8b8b8b8b8b/sample.xlsx`;
      fileExtension = 'xlsx';
      fileType = 'Excel文档';
    } else if (contentType.includes('presentationml')) {
      mockFileUrl = `https://file-examples.com/storage/fe68c8b8b8b8b8b8b8b8b8b/sample.pptx`;
      fileExtension = 'pptx';
      fileType = 'PowerPoint文档';
    } else {
      mockFileUrl = `https://picsum.photos/400/300?random=${timestamp}`;
      fileExtension = 'file';
      fileType = '文件';
    }
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        url: mockFileUrl,
        message: `${fileType}上传成功`,
        filename: `upload-${randomId}.${fileExtension}`,
        size: '1.2MB',
        type: fileType,
        note: '当前使用演示文件，建议配置云存储服务'
      }) 
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: '文件上传失败' }) 
    };
  }
};
