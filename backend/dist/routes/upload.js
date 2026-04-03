import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
const router = Router();
// 配置 multer 临时存储
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
// 确保上传目录存在
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}
// 动态导入阿里云 OSS（避免类型问题）
async function createOSSClient() {
    const region = process.env.ALIYUN_OSS_REGION;
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    const bucket = process.env.ALIYUN_OSS_BUCKET;
    if (!region || !accessKeyId || !accessKeySecret || !bucket) {
        console.log('阿里云 OSS 配置不完整，将使用本地存储');
        return null;
    }
    try {
        const OSS = (await import('ali-oss')).default;
        return new OSS({
            region,
            accessKeyId,
            accessKeySecret,
            bucket,
            secure: true // 使用 HTTPS
        });
    }
    catch (error) {
        console.error('初始化 OSS 客户端失败:', error);
        return null;
    }
}
// 解析文件内容
async function parseFileContent(filePath, mimeType) {
    try {
        // PDF 文件
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfParseModule = await import('pdf-parse');
            const pdfParse = pdfParseModule.default || pdfParseModule;
            const pdfData = await pdfParse(dataBuffer);
            return pdfData.text;
        }
        // Word 文档
        if (mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }
        // 文本文件
        if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
            return fs.readFileSync(filePath, 'utf-8');
        }
        return '不支持的文件类型';
    }
    catch (error) {
        console.error('解析文件失败:', error);
        throw new Error('文件解析失败');
    }
}
// 上传文件到阿里云 OSS
async function uploadToOSS(ossClient, filePath, originalName) {
    if (!ossClient) {
        return null; // 本地存储模式
    }
    try {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const ossKey = `uploads/${timestamp}_${Math.random().toString(36).substring(7)}${ext}`;
        const result = await ossClient.put(ossKey, filePath);
        return result.url;
    }
    catch (error) {
        console.error('上传到 OSS 失败:', error);
        return null;
    }
}
// 文件上传接口
router.post('/:graphId/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { graphId } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        // 检查文件类型
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            // 删除临时文件
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: '不支持的文件类型' });
        }
        // 解析文件内容
        const content = await parseFileContent(file.path, file.mimetype);
        // 上传到阿里云 OSS（如果配置了）
        const ossClient = await createOSSClient();
        const ossUrl = await uploadToOSS(ossClient, file.path, file.originalname);
        // 删除临时文件
        fs.unlinkSync(file.path);
        // 返回结果
        res.json({
            success: true,
            message: '文件上传成功',
            filename: file.originalname,
            content: content.slice(0, 5000), // 限制返回内容长度
            ossUrl, // 阿里云 OSS 地址（如果上传成功）
            size: file.size
        });
    }
    catch (error) {
        console.error('文件上传错误:', error);
        // 清理临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: '文件上传失败' });
    }
});
// 获取上传配置信息（供前端检查）
router.get('/config', authMiddleware, async (req, res) => {
    const ossClient = await createOSSClient();
    res.json({
        ossEnabled: !!ossClient,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
        ]
    });
});
export default router;
//# sourceMappingURL=upload.js.map