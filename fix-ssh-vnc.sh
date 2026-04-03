#!/bin/bash

echo "=========================================="
echo "检查并修复 SSH 服务"
echo "=========================================="
echo ""

echo "请执行以下命令:"
echo ""

echo "1. 检查 SSH 服务状态:"
echo "   sudo systemctl status ssh"
echo ""

echo "2. 检查 SSH 配置文件:"
echo "   cat /etc/ssh/sshd_config | grep -E '^Port|^#Port'"
echo ""

echo "3. 检查端口监听:"
echo "   sudo netstat -tlnp | grep sshd"
echo ""

echo "=========================================="
echo "根据检查结果修复"
echo "=========================================="
echo ""

echo "【情况 A】如果 SSH 服务没运行:"
echo "   sudo systemctl start ssh"
echo "   sudo systemctl enable ssh"
echo ""

echo "【情况 B】如果配置还是 Port 22:"
echo "   sudo nano /etc/ssh/sshd_config"
echo "   # 修改为 Port 443"
echo "   sudo systemctl restart ssh"
echo ""

echo "【情况 C】如果配置文件有多行 Port:"
echo "   sudo nano /etc/ssh/sshd_config"
echo "   # 只保留一行: Port 443"
echo "   # 其他 Port 行前面加 # 注释掉"
echo "   sudo systemctl restart ssh"
echo ""

echo "【情况 D】如果还是不行，恢复默认:"
echo "   sudo nano /etc/ssh/sshd_config"
echo "   # 改回 Port 22"
echo "   sudo systemctl restart ssh"
echo "   # 然后换 WiFi 网络连接"
echo ""

echo "=========================================="
echo "修复后验证"
echo "=========================================="
echo ""
echo "   sudo netstat -tlnp | grep sshd"
echo "   # 应该看到 0.0.0.0:443"
echo ""
echo "=========================================="
