#!/bin/bash

echo "=========================================="
echo "检查 SSH 服务状态"
echo "=========================================="
echo ""

echo "1. 检查 SSH 配置:"
grep -E "^Port|^#Port" /etc/ssh/sshd_config

echo ""
echo "2. 检查 SSH 进程:"
ps aux | grep sshd | grep -v grep

echo ""
echo "3. 检查端口监听:"
netstat -tlnp 2>/dev/null | grep -E ":22|:443" || ss -tlnp 2>/dev/null | grep -E ":22|:443"

echo ""
echo "4. 检查 SSH 服务状态:"
systemctl status ssh 2>&1 | head -10

echo ""
echo "5. 测试本地连接:"
ssh -p 443 localhost "echo OK" 2>&1 || echo "本地连接失败"

echo ""
echo "=========================================="
echo "如果 443 端口没有监听，尝试:"
echo "=========================================="
echo ""
echo "1. 重新加载配置:"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl restart ssh"
echo ""
echo "2. 检查配置文件语法:"
echo "   sudo sshd -t"
echo ""
echo "3. 查看错误日志:"
echo "   sudo journalctl -u ssh -n 20"
echo "   或"
echo "   sudo tail -20 /var/log/auth.log"
echo ""
echo "4. 手动启动调试模式:"
echo "   sudo /usr/sbin/sshd -d -p 443"
echo ""
echo "=========================================="
