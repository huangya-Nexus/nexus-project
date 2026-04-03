#!/bin/bash

# 阿里云 ECS 连接诊断脚本

echo "=========================================="
echo "阿里云 ECS 连接诊断"
echo "=========================================="
echo ""

SERVER_IP="47.83.173.6"
SERVER_PORT="22"
KEY_FILE="/Users/huangya/Documents/阿里云密钥对.pem"

echo "1. 检查私钥文件"
echo "   路径: $KEY_FILE"
if [ -f "$KEY_FILE" ]; then
    echo "   ✓ 文件存在"
    echo "   权限: $(ls -la $KEY_FILE | awk '{print $1}')"
    
    # 检查文件头
    KEY_HEADER=$(head -1 "$KEY_FILE")
    if [[ "$KEY_HEADER" == "-----BEGIN"* ]]; then
        echo "   ✓ 文件格式正确 ($KEY_HEADER)"
    else
        echo "   ✗ 文件格式可能不正确"
    fi
else
    echo "   ✗ 文件不存在"
fi

echo ""
echo "2. 检查网络连接"
echo "   目标: $SERVER_IP:$SERVER_PORT"

# 使用 curl 检查端口连通性
curl -v telnet://$SERVER_IP:$SERVER_PORT 2>&1 | head -5 &
CURL_PID=$!
sleep 3
kill $CURL_PID 2>/dev/null

echo ""
echo "3. SSH 连接测试"
echo "   命令: ssh -i $KEY_FILE root@$SERVER_IP -p $SERVER_PORT"
echo ""
echo "   尝试连接中... (最多等待10秒)"

# 尝试 SSH 连接
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes \
    -i "$KEY_FILE" root@$SERVER_IP -p $SERVER_PORT "echo '✓ SSH 连接成功'" 2>&1

SSH_EXIT=$?

echo ""
echo "=========================================="
if [ $SSH_EXIT -eq 0 ]; then
    echo "诊断结果: ✓ 连接正常"
else
    echo "诊断结果: ✗ 连接失败 (退出码: $SSH_EXIT)"
    echo ""
    echo "可能原因:"
    echo "  1. 服务器未启动 - 请登录阿里云控制台检查实例状态"
    echo "  2. 安全组规则 - 检查是否允许你的IP访问22端口"
    echo "  3. 网络问题 - 检查你的网络是否能访问公网"
    echo "  4. 密钥问题 - 确认使用的是正确的密钥对"
    echo ""
    echo "建议操作:"
    echo "  1. 登录 https://ecs.console.aliyun.com"
    echo "  2. 检查实例运行状态"
    echo "  3. 检查安全组入方向规则"
    echo "  4. 尝试重置实例密码后用密码登录"
fi
echo "=========================================="
