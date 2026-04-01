import OpenAI from 'openai'

export interface KnowledgeNode {
  title: string
  content: string
  keywords: string[]
}

export interface RelationSuggestion {
  type: 'RELATED' | 'PREREQUISITE' | 'EXTENDS' | 'SIMILAR' | 'CONTRASTS'
  label: string
  confidence: number
}

export interface AIService {
  extractKnowledge(text: string): Promise<KnowledgeNode[]>
  suggestRelations(nodeA: KnowledgeNode, nodeB: KnowledgeNode): Promise<RelationSuggestion | null>
  generateSummary(content: string): Promise<string>
}

export class OpenAIService implements AIService {
  private client: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    const baseURL = process.env.OPENAI_BASE_URL
    this.client = new OpenAI({ apiKey, baseURL })
  }

  async extractKnowledge(text: string): Promise<KnowledgeNode[]> {
    const prompt = `请从以下学习资料中提取关键知识点，以JSON格式返回。

要求：
1. 每个知识点包含：title(标题), content(详细内容), keywords(关键词数组)
2. 提取3-10个核心知识点
3. 内容要详细但简洁
4. 关键词用于建立知识关联

学习资料：
${text}

请返回以下JSON格式：
{
  "nodes": [
    {
      "title": "知识点标题",
      "content": "详细解释...",
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}`

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '你是一个专业的知识提取助手，擅长从学习资料中提取结构化知识点。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      // 提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const result = JSON.parse(jsonMatch[0])
      return result.nodes || []
    } catch (error) {
      console.error('Failed to parse AI response:', content)
      throw new Error('Failed to parse knowledge extraction result')
    }
  }

  async suggestRelations(nodeA: KnowledgeNode, nodeB: KnowledgeNode): Promise<RelationSuggestion | null> {
    const prompt = `分析以下两个知识点的关系：

知识点A：${nodeA.title}
内容：${nodeA.content}

知识点B：${nodeB.title}
内容：${nodeB.content}

请判断它们之间的关系类型（如果没有明显关系返回null）：
- RELATED: 相关
- PREREQUISITE: A是B的前置知识
- EXTENDS: B扩展了A
- SIMILAR: 相似概念
- CONTRASTS: 对比关系

返回JSON格式：
{
  "type": "关系类型",
  "label": "简短描述",
  "confidence": 0.85
}
或 null`

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '你是一个知识图谱分析专家，擅长识别知识点之间的逻辑关系。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null
      return JSON.parse(jsonMatch[0])
    } catch {
      return null
    }
  }

  async generateSummary(content: string): Promise<string> {
    const prompt = `请为以下内容生成一个简洁的摘要（100字以内）：

${content}

摘要：` 

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '你是一个专业的内容摘要助手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    return response.choices[0]?.message?.content?.trim() || ''
  }
}

// 模拟 AI 服务（用于开发和测试）
export class MockAIService implements AIService {
  async extractKnowledge(text: string): Promise<KnowledgeNode[]> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return [
      {
        title: '核心概念一',
        content: `基于输入文本提取的核心概念：${text.slice(0, 100)}...`,
        keywords: ['概念', '核心', '学习']
      },
      {
        title: '核心概念二',
        content: '这是第二个自动提取的知识点',
        keywords: ['知识点', '提取']
      }
    ]
  }

  async suggestRelations(nodeA: KnowledgeNode, nodeB: KnowledgeNode): Promise<RelationSuggestion | null> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      type: 'RELATED',
      label: '相关概念',
      confidence: 0.8
    }
  }

  async generateSummary(content: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return content.slice(0, 100) + '...'
  }
}

// 工厂函数
export function createAIService(): AIService {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIService()
  }
  console.log('Using Mock AI Service (set OPENAI_API_KEY to use OpenAI)')
  return new MockAIService()
}
