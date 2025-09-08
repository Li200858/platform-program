# 使用Node.js 18作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY server/package*.json ./server/

# 安装依赖
RUN npm install
RUN cd server && npm install

# 复制源代码
COPY . .

# 构建前端
RUN cd client && npm install && npm run build

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["cd", "server", "&&", "npm", "start"]
