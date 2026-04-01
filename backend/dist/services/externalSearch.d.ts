export interface ExternalSearchResult {
    source: string;
    title: string;
    content: string;
    url: string;
    metadata?: Record<string, any>;
}
export declare function searchWikipedia(query: string, limit?: number): Promise<ExternalSearchResult[]>;
export declare function searchArxiv(query: string, limit?: number): Promise<ExternalSearchResult[]>;
export declare function searchGitHub(query: string, limit?: number): Promise<ExternalSearchResult[]>;
export declare function searchPubMed(query: string, limit?: number): Promise<ExternalSearchResult[]>;
export declare function multiSourceSearch(query: string, sources?: string[]): Promise<ExternalSearchResult[]>;
