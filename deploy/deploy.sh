#!/bin/bash

# SubScribe 自动部署脚本
# 适用于 Ubuntu/Debian/CentOS 系统

set -e

echo "🚀 开始部署 SubScribe..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 权限运行此脚本"
        exit 1
    fi
}

# 检测系统类型
detect_system() {
    if [ -f /etc/redhat-release ]; then
        SYSTEM="centos"
        PACKAGE_MANAGER="yum"
    elif [ -f /etc/debian_version ]; then
        SYSTEM="debian"
        PACKAGE_MANAGER="apt"
    else
        print_error "不支持的系统类型"
        exit 1
    fi
    print_message "检测到系统: $SYSTEM"
}

# 安装基础依赖
install_dependencies() {
    print_message "安装基础依赖..."
    
    if [ "$SYSTEM" = "debian" ]; then
        apt update
        apt install -y curl wget git nginx nodejs npm
    elif [ "$SYSTEM" = "centos" ]; then
        yum update -y
        yum install -y curl wget git nginx nodejs npm
    fi
}

# 安装 Node.js (如果版本不够)
install_nodejs() {
    NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
    
    if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
        print_message "安装 Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        if [ "$SYSTEM" = "debian" ]; then
            apt-get install -y nodejs
        elif [ "$SYSTEM" = "centos" ]; then
            yum install -y nodejs
        fi
    fi
}

# 创建用户和目录
setup_user() {
    print_message "创建应用用户和目录..."
    
    # 创建用户
    if ! id "subscribetracker" &>/dev/null; then
        useradd -r -d /opt/subscribetracker -s /bin/bash subscribetracker
    fi
    
    # 创建目录
    mkdir -p /opt/subscribetracker
    mkdir -p /opt/subscribetracker/logs
    mkdir -p /opt/subscribetracker/data
    
    chown -R subscribetracker:subscribetracker /opt/subscribetracker
}

# 下载和部署应用
deploy_app() {
    print_message "下载和部署应用..."
    
    cd /opt/subscribetracker
    
    # 备份现有部署
    if [ -d "current" ]; then
        mv current backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # 克隆最新代码
    git clone https://github.com/RY-zzcn/SubScribeTracker.git current
    cd current
    
    # 安装依赖
    npm run install:all
    
    # 构建前端
    npm run build:frontend
    
    # 设置权限
    chown -R subscribetracker:subscribetracker /opt/subscribetracker
}

# 配置环境变量
setup_environment() {
    print_message "配置环境变量..."
    
    cd /opt/subscribetracker/current
    
    if [ ! -f .env ]; then
        cp .env.example .env
        
        # 生成随机 JWT 密钥
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
        
        print_warning "请编辑 /opt/subscribetracker/current/.env 文件配置您的环境变量"
        print_warning "特别是数据库和通知服务配置"
    fi
}

# 配置 systemd 服务
setup_systemd() {
    print_message "配置 systemd 服务..."
    
    cat > /etc/systemd/system/subscribetracker.service << EOF
[Unit]
Description=SubScribe Tracker
After=network.target

[Service]
Type=simple
User=subscribetracker
WorkingDirectory=/opt/subscribetracker/current/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable subscribetracker
}

# 配置 Nginx
setup_nginx() {
    print_message "配置 Nginx..."
    
    cat > /etc/nginx/sites-available/subscribetracker << EOF
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /opt/subscribetracker/current/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001;
    }
}
EOF

    # 启用站点
    if [ -d "/etc/nginx/sites-enabled" ]; then
        ln -sf /etc/nginx/sites-available/subscribetracker /etc/nginx/sites-enabled/
    else
        # CentOS 风格配置
        cp /etc/nginx/sites-available/subscribetracker /etc/nginx/conf.d/subscribetracker.conf
    fi
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl restart nginx
    systemctl enable nginx
}

# 启动服务
start_services() {
    print_message "启动服务..."
    
    systemctl start subscribetracker
    systemctl status subscribetracker --no-pager
}

# 安装 SSL 证书 (可选)
install_ssl() {
    read -p "是否安装 SSL 证书? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "安装 Let's Encrypt SSL 证书..."
        
        # 安装 certbot
        if [ "$SYSTEM" = "debian" ]; then
            apt install -y certbot python3-certbot-nginx
        elif [ "$SYSTEM" = "centos" ]; then
            yum install -y certbot python3-certbot-nginx
        fi
        
        read -p "请输入您的域名: " DOMAIN
        
        certbot --nginx -d $DOMAIN
        
        # 设置自动续期
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    fi
}

# 显示部署信息
show_info() {
    print_message "部署完成！"
    echo
    echo "🎉 SubScribe 已成功部署"
    echo
    echo "📁 应用目录: /opt/subscribetracker/current"
    echo "📝 配置文件: /opt/subscribetracker/current/.env"
    echo "📋 日志文件: /opt/subscribetracker/logs/"
    echo
    echo "🔧 管理命令:"
    echo "  启动服务: systemctl start subscribetracker"
    echo "  停止服务: systemctl stop subscribetracker"
    echo "  重启服务: systemctl restart subscribetracker"
    echo "  查看状态: systemctl status subscribetracker"
    echo "  查看日志: journalctl -u subscribetracker -f"
    echo
    echo "🌐 访问地址: http://your-server-ip"
    echo
    print_warning "请确保:"
    print_warning "1. 编辑 .env 文件配置必要的环境变量"
    print_warning "2. 配置防火墙开放 80 和 443 端口"
    print_warning "3. 如果使用域名，请配置 DNS 解析"
}

# 主函数
main() {
    echo "🎯 SubScribe 自动部署脚本"
    echo "================================"
    echo
    
    check_root
    detect_system
    install_dependencies
    install_nodejs
    setup_user
    deploy_app
    setup_environment
    setup_systemd
    setup_nginx
    start_services
    install_ssl
    show_info
}

# 运行主函数
main "$@"