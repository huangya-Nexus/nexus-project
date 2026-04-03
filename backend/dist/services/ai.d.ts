export interface KnowledgeNode {
    title: string;
    content: string;
    keywords: string[];
}
export interface RelationSuggestion {
    type: 'RELATED' | 'PREREQUISITE' | 'EXTENDS' | 'SIMILAR' | 'CONTRASTS';
    label: string;
    confidence: number;
}
export interface AIService {
    extractKnowledge(text: string): Promise<KnowledgeNode[]>;
    suggestRelations(nodeA: KnowledgeNode, nodeB: KnowledgeNode): Promise<RelationSuggestion | null>;
    generateSummary(content: string): Promise<string>;
    generateText(prompt: string): Promise<string>;
}
export declare class OpenAIService implements AIService {
    private client;
    constructor();
    extractKnowledge(text: string): Promise<KnowledgeNode[]>;
    suggestRelations(nodeA: KnowledgeNode, nodeB: KnowledgeNode): Promise<RelationSuggestion | null>;
    generateSummary(content: string): Promise<string>;
    generateText(prompt: string): Promise<string>;
}
export declare class MockAIService implements AIService {
    extractKnowledge(text: string): Promise<KnowledgeNode[]>;
    suggestRelations(nodeA: KnowledgeNode, nodeB: KnowledgeNode): Promise<RelationSuggestion | null>;
    generateSummary(content: string): Promise<string>;
    generateText(prompt: string): Promise<string>;
}
export declare function createAIService(): AIService;
