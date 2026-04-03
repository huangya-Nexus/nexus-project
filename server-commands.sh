#!/bin/bash

echo "=========================================="
echo "在服务器上执行以下命令"
echo "=========================================="
echo ""

echo "1. 检查当前防火墙状态:"
echo "   sudo ufw status"
echo ""

echo "2. 开放 443 端口:"
echo "   sudo ufw allow 443/tcp"
echo "   sudo ufw reload"
echo ""

echo "3. 或者使用 iptables:"
echo "   sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT"
echo "   sudo iptables-save"
echo ""

echo "4. 检查 SSH 监听状态:"
echo "   sudo netstat -tlnp | grep ssh"
echo "   或"
echo "   sudo ss -tlnp | grep ssh"
echo ""

echo "5. 检查 SSH 配置是否正确:"
echo "   grep Port /etc/ssh/sshd_config"
echo ""

echo "6. 如果还是不行，检查阿里云防火墙:"
echo "   登录 https://swas.console.aliyun.com"
echo "   安全 → 防火墙 → 添加 443 端口规则"
echo ""

echo "=========================================="
