# 使用Node.js 18作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY server/package*.json ./

# 安装依赖
RUN npm install

# 复制服务器源代码
COPY server/ .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["npm", "start"]