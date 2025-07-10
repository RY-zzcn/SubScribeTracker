#!/bin/bash

# Cloudflare Pages 部署脚本

echo "🚀 开始构建 SubScribe 前端..."

# 进入前端目录
cd frontend

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

echo "✅ 构建完成！"
echo "📁 构建产物位于: frontend/dist"

# 如果有 wrangler CLI，可以直接部署
if command -v wrangler &> /dev/null; then
    echo "🌐 部署到 Cloudflare Pages..."
    wrangler pages deploy dist --project-name=subscribetracker
else
    echo "💡 请安装 wrangler CLI 或使用 Cloudflare Dashboard 手动部署"
    echo "   构建产物目录: frontend/dist"
fi