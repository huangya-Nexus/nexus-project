#!/bin/bash

echo "=========================================="
echo "阿里云服务器连接自动修复脚本"
echo "=========================================="
echo ""

SERVER_IP="47.83.173.6"
KEY_FILE="/Users/huangya/Documents/阿里云密钥对.pem"

echo "诊断结果:"
echo "  - 百度可访问 ✓"
echo "  - 阿里云官网返回 403 (可能被限制)"
echo "  - 目标服务器 $SERVER_IP 无法连接"
echo "  - 检测到 VPN 进程在运行"
echo ""

echo "=========================================="
echo "自动修复方案"
echo "=========================================="
echo ""

echo "【方案 1】临时断开 VPN"
echo "  操作步骤:"
echo "  1. 点击屏幕顶部菜单栏的 VPN 图标"
echo "  2. 选择 '断开连接' 或 'Disconnect'"
echo "  3. 重新尝试 SSH 连接"
echo "  4. 连接成功后再开启 VPN"
echo ""

echo "【方案 2】配置 VPN 分流 (推荐)"
echo "  让 VPN 不代理 SSH 连接:"
echo "  1. 打开 VPN 客户端设置"
echo "  2. 找到 '分流' 或 'Split Tunneling' 选项"
echo "  3. 添加排除规则:"
echo "     - 类型: IP 地址"
echo "     - 地址: $SERVER_IP"
echo "     - 端口: 22"
echo "  4. 保存设置并重连 VPN"
echo ""

echo "【方案 3】使用代理跳转"
echo "  通过一台可访问的服务器跳转:"
echo "  1. 找一台可以访问 $SERVER_IP 的中转服务器"
echo "  2. 配置 SSH ProxyJump:"
echo ""
echo "     Host aliyun-jump"
echo "         HostName $SERVER_IP"
echo "         User ubuntu"
echo "         IdentityFile $KEY_FILE"
echo "         ProxyJump user@中转服务器"
echo ""

echo "【方案 4】修改 VPN 为全局模式"
echo "  某些 VPN 的 '绕过大陆' 模式会导致问题:"
echo "  1. 打开 VPN 客户端"
echo "  2. 将模式从 '绕过大陆' 改为 '全局模式'"
echo "  3. 重新连接 VPN"
echo "  4. 再次尝试 SSH 连接"
echo ""

echo "【方案 5】使用阿里云控制台 VNC"
echo "  不依赖本地网络:"
echo "  1. 登录 https://swas.console.aliyun.com"
echo "  2. 找到服务器 → 远程连接"
echo "  3. 选择 'VNC 远程连接'"
echo "  4. 使用密码登录 (无需 SSH)"
echo ""

echo "=========================================="
echo "快速测试命令"
echo "=========================================="
echo ""
echo "测试 1 - 直接连接:"
echo "  ssh -i \"$KEY_FILE\" ubuntu@$SERVER_IP"
echo ""
echo "测试 2 - 详细调试:"
echo "  ssh -vvv -i \"$KEY_FILE\" ubuntu@$SERVER_IP"
echo ""
echo "测试 3 - 使用密码方式测试网络:"
echo "  ssh -o PreferredAuthentications=password root@$SERVER_IP"
echo ""
echo "=========================================="
echo ""
echo "请尝试【方案 1】或【方案 2】，这是最常见的解决方法。"
echo ""

# 尝试自动检测 VPN 状态并给出建议
echo "正在检测网络环境..."

# 检查是否能通过 VPN 访问
VPN_TEST=$(curl -s --max-time 3 http://ip-api.com/json/ 2>/dev/null | grep -o '"country":"[^"]*"' | cut -d'"' -f4)
if [ -n "$VPN_TEST" ]; then
    echo ""
    echo "检测到 VPN 出口位置: $VPN_TEST"
    if [ "$VPN_TEST" = "China" ]; then
        echo "VPN 出口在国内，可能需要切换到国外节点"
    else
        echo "VPN 出口在国外，可能需要添加分流规则"
    fi
fi

echo ""
echo "=========================================="
