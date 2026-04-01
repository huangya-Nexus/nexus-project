import { Router } from 'express';
import multer from 'multer';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { prisma } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// 配置 multer 存储
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
// 文件过滤器
const fileFilter = (_req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('不支持的文件类型'), false);
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
// 确保上传目录存在
import fs from 'fs';
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
// 上传文件并解析
router.post('/:graphId/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const graphId = String(req.params.graphId);
        const userId = String(req.user.userId);
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;
        let content = '';
        // 根据文件类型解析内容
        try {
            if (mimeType === 'application/pdf') {
                // 解析 PDF
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                content = pdfData.text;
            }
            else if (mimeType === 'application/msword' ||
                mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // 解析 Word
                const result = await mammoth.extractRawText({ path: filePath });
                content = result.value;
            }
            else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
                // 读取文本文件
                content = fs.readFileSync(filePath, 'utf-8');
            }
            // 限制内容长度
            if (content.length > 50000) {
                content = content.substring(0, 50000) + '...';
            }
            // 创建导入任务
            const task = await prisma.importTask.create({
                data: {
                    id: uuidv4(),
                    type: 'FILE',
                    status: 'COMPLETED',
                    filename: fileName,
                    fileUrl: filePath,
                    content: content,
                    userId,
                    graphId
                }
            });
            // 删除临时文件
            fs.unlinkSync(filePath);
            res.json({
                message: '文件上传成功',
                taskId: task.id,
                content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
                contentLength: content.length
            });
        }
        catch (parseError) {
            // 删除临时文件
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw parseError;
        }
    }
    catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ error: '文件上传失败' });
    }
});
// 获取文件内容
router.get('/:taskId/content', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const userId = req.user.userId;
        const task = await prisma.importTask.findFirst({
            where: { id: taskId, userId }
        });
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        res.json({
            content: task.content,
            filename: task.filename
        });
    }
    catch (error) {
        console.error('获取文件内容错误:', error);
        res.status(500).json({ error: '获取文件内容失败' });
    }
});
// 删除上传任务
router.delete('/:taskId', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const userId = req.user.userId;
        const task = await prisma.importTask.findFirst({
            where: { id: taskId, userId }
        });
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        await prisma.importTask.delete({
            where: { id: taskId }
        });
        res.json({ message: '删除成功' });
    }
    catch (error) {
        console.error('删除任务错误:', error);
        res.status(500).json({ error: '删除失败' });
    }
});
export default router;
//# sourceMappingURL=upload.js.map