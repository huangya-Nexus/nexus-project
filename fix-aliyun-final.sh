#!/bin/bash

echo "=========================================="
echo "阿里云客户端连接问题 - 终极修复方案"
echo "=========================================="
echo ""

echo "问题分析:"
echo "  - VPN 已断开 ✓"
echo "  - 但阿里云客户端显示 '未连接到 AirPort 网络'"
echo "  - 本机地址显示为 127.0.0.1 (回环地址)"
echo "  - 端口 22 已开放 ✓"
echo ""

echo "=========================================="
echo "修复步骤 (按顺序尝试)"
echo "=========================================="
echo ""

echo "【步骤 1】检查实际网络连接"
echo "----------------------------------------"
echo "当前网络状态:"
echo "  百度访问: $(curl -s --max-time 3 -o /dev/null -w '%{http_code}' https://www.baidu.com 2>/dev/null)"
echo "  阿里云访问: $(curl -s --max-time 3 -o /dev/null -w '%{http_code}' https://www.aliyun.com 2>/dev/null)"
echo ""
echo "如果百度返回 200，说明有网络连接"
echo ""

echo "【步骤 2】重启阿里云客户端"
echo "----------------------------------------"
echo "操作:"
echo "  1. 完全退出阿里云客户端"
echo "  2. 重新打开客户端"
echo "  3. 重新尝试连接"
echo ""

echo "【步骤 3】使用终端直接连接 (绕过客户端)"
echo "----------------------------------------"
echo "命令:"
echo "  ssh -i '/Users/huangya/Documents/阿里云密钥对.pem' root@47.83.173.6"
echo ""
echo "或尝试 ubuntu 用户:"
echo "  ssh -i '/Users/huangya/Documents/阿里云密钥对.pem' ubuntu@47.83.173.6"
echo ""

echo "【步骤 4】重置服务器密码后使用密码登录"
echo "----------------------------------------"
echo "操作:"
echo "  1. 登录 https://swas.console.aliyun.com"
echo "  2. 找到服务器 → 更多 → 重置密码"
echo "  3. 设置新密码后重启服务器"
echo "  4. 使用密码方式连接"
echo ""

echo "【步骤 5】使用 VNC 远程连接 (不依赖 SSH)"
echo "----------------------------------------"
echo "操作:"
echo "  1. 登录 https://swas.console.aliyun.com"
echo "  2. 找到服务器 → 远程连接"
echo "  3. 选择 'VNC 远程连接'"
echo "  4. 使用密码登录"
echo ""

echo "【步骤 6】检查服务器 SSH 服务"
echo "----------------------------------------"
echo "通过 VNC 登录后执行:"
echo "  sudo systemctl status sshd"
echo "  sudo systemctl restart sshd"
echo "  sudo netstat -tlnp | grep 22"
echo ""

echo "【步骤 7】检查服务器防火墙"
echo "----------------------------------------"
echo "通过 VNC 登录后执行:"
echo "  sudo iptables -L -n | grep 22"
echo "  sudo ufw status"
echo ""

echo "=========================================="
echo "推荐操作顺序"
echo "=========================================="
echo ""
echo "方案 A (最快):"
echo "  1. 使用终端直接 SSH 连接 (步骤 3)"
echo "  2. 如果失败，使用 VNC 连接 (步骤 5)"
echo ""
echo "方案 B (最可靠):"
echo "  1. 使用 VNC 连接检查 SSH 服务 (步骤 5+6)"
echo "  2. 修复 SSH 服务后使用密钥连接"
echo ""
echo "=========================================="

# 尝试自动修复 - 重置网络服务
echo ""
echo "正在尝试自动修复网络检测..."
echo ""

# 检查是否有其他网络接口
ACTIVE_INTERFACE=$(route -n get default 2>/dev/null | grep interface | awk '{print $2}')
if [ -n "$ACTIVE_INTERFACE" ]; then
    echo "检测到活动网络接口: $ACTIVE_INTERFACE"
    IP_ADDR=$(ifconfig $ACTIVE_INTERFACE 2>/dev/null | grep "inet " | awk '{print $2}' | head -1)
    echo "IP 地址: $IP_ADDR"
else
    echo "未检测到默认网络接口"
fi

echo ""
echo "=========================================="
echo ""

# 询问用户是否要尝试终端连接
read -p "是否现在尝试使用终端 SSH 连接? (y/n): " answer
if [ "$answer" = "y" ]; then
    echo "尝试连接..."
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
        -i "/Users/huangya/Documents/阿里云密钥对.pem" \
        root@47.83.173.6 "echo '连接成功!'" 2>&1
fi
