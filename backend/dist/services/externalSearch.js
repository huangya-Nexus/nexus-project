import axios from 'axios';
// 模拟维基百科搜索结果 (用于网络不通时)
function getMockWikipediaResults(query, limit) {
    const mockData = {
        '机器学习': [
            {
                source: 'wikipedia',
                title: '机器学习',
                content: '机器学习是人工智能的一个分支，它使计算机系统能够从数据中学习并改进，而无需明确编程。机器学习算法使用统计学方法从数据中找到模式，并用这些模式对新数据做出预测。',
                url: 'https://zh.wikipedia.org/wiki/机器学习',
                metadata: { wordCount: 5000 }
            },
            {
                source: 'wikipedia',
                title: '深度学习',
                content: '深度学习是机器学习的一个子领域，基于人工神经网络。深度学习模型通过多层非线性变换来学习数据的层次化表示，在图像识别、自然语言处理等领域取得了突破性进展。',
                url: 'https://zh.wikipedia.org/wiki/深度学习',
                metadata: { wordCount: 3500 }
            }
        ],
        '秦始皇': [
            {
                source: 'wikipedia',
                title: '秦始皇',
                content: '秦始皇（前259年－前210年），嬴姓，赵氏，名政，是中国历史上第一个称皇帝的君主。他统一了六国，建立了中央集权的秦朝，推行书同文、车同轨、统一度量衡等政策。',
                url: 'https://zh.wikipedia.org/wiki/秦始皇',
                metadata: { wordCount: 8000 }
            }
        ]
    };
    // 返回匹配的模拟数据，或通用响应
    return mockData[query] || [
        {
            source: 'wikipedia',
            title: `${query} - 维基百科`,
            content: `${query}是一个重要的知识领域。由于网络连接问题，这里显示的是示例内容。实际使用时，系统将从维基百科获取完整内容。`,
            url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            metadata: { wordCount: 1000, note: '模拟数据' }
        }
    ];
}
// 维基百科搜索
export async function searchWikipedia(query, limit = 5) {
    try {
        // 检查是否有网络问题，如果有则返回模拟数据
        const isOffline = process.env.OFFLINE_MODE === 'true';
        if (isOffline) {
            return getMockWikipediaResults(query, limit);
        }
        // 1. 搜索词条 (添加超时)
        const searchRes = await axios.get('https://zh.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                list: 'search',
                srsearch: query,
                format: 'json',
                origin: '*',
                srlimit: limit
            },
            timeout: 3000 // 3秒超时
        });
        const searchResults = searchRes.data.query?.search || [];
        const results = [];
        // 2. 获取每个词条的详细内容 (最多取前3个)
        for (const item of searchResults.slice(0, 3)) {
            try {
                const contentRes = await axios.get('https://zh.wikipedia.org/w/api.php', {
                    timeout: 5000,
                    params: {
                        action: 'query',
                        prop: 'extracts',
                        exintro: true,
                        explaintext: true,
                        titles: item.title,
                        format: 'json',
                        origin: '*'
                    }
                });
                const pages = contentRes.data.query.pages;
                const page = Object.values(pages)[0];
                results.push({
                    source: 'wikipedia',
                    title: item.title,
                    content: page.extract || item.snippet,
                    url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
                    metadata: {
                        wordCount: item.wordcount,
                        timestamp: item.timestamp
                    }
                });
            }
            catch (e) {
                console.error('获取维基百科详情失败:', e);
            }
        }
        return results;
    }
    catch (error) {
        console.error('维基百科搜索失败:', error);
        // 网络错误时返回模拟数据
        return getMockWikipediaResults(query, limit);
    }
}
// arXiv 学术论文搜索
export async function searchArxiv(query, limit = 5) {
    try {
        const res = await axios.get('http://export.arxiv.org/api/query', {
            params: {
                search_query: `all:${query}`,
                start: 0,
                max_results: limit,
                sortBy: 'relevance',
                sortOrder: 'descending'
            },
            timeout: 8000
        });
        // 解析 XML 响应
        const xml = res.data;
        const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        const results = [];
        for (const entry of entries.slice(0, limit)) {
            const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
            const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '';
            const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
            const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
            // 提取作者
            const authors = (entry.match(/<name>(.*?)<\/name>/g) || [])
                .map((a) => a.replace(/<\/?name>/g, ''))
                .slice(0, 3)
                .join(', ');
            if (title && summary) {
                results.push({
                    source: 'arxiv',
                    title: title.replace(/\n/g, ' '),
                    content: summary.replace(/\n/g, ' ').substring(0, 500),
                    url: id,
                    metadata: {
                        published,
                        authors: authors || 'Unknown'
                    }
                });
            }
        }
        return results;
    }
    catch (error) {
        console.error('arXiv搜索失败:', error);
        return [];
    }
}
// GitHub 搜索（技术文档/代码）
export async function searchGitHub(query, limit = 5) {
    try {
        const res = await axios.get('https://api.github.com/search/repositories', {
            params: {
                q: query,
                sort: 'stars',
                order: 'desc',
                per_page: limit
            },
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 5000
        });
        return res.data.items.map((item) => ({
            source: 'github',
            title: item.full_name,
            content: item.description || 'No description',
            url: item.html_url,
            metadata: {
                stars: item.stargazers_count,
                language: item.language,
                updated: item.updated_at
            }
        }));
    }
    catch (error) {
        console.error('GitHub搜索失败:', error);
        return [];
    }
}
// PubMed 医学文献搜索
export async function searchPubMed(query, limit = 5) {
    try {
        // 1. 搜索文章ID
        const searchRes = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
            params: {
                db: 'pubmed',
                term: query,
                retmode: 'json',
                retmax: limit
            },
            timeout: 8000
        });
        const ids = searchRes.data.esearchresult.idlist;
        if (ids.length === 0)
            return [];
        // 2. 获取文章详情
        const summaryRes = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
            params: {
                db: 'pubmed',
                id: ids.join(','),
                retmode: 'json'
            },
            timeout: 8000
        });
        const results = [];
        const articles = summaryRes.data.result;
        for (const id of ids) {
            const article = articles[id];
            if (article) {
                results.push({
                    source: 'pubmed',
                    title: article.title,
                    content: `Authors: ${article.authors?.map((a) => a.name).join(', ') || 'Unknown'}`,
                    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                    metadata: {
                        pubdate: article.pubdate,
                        journal: article.fulljournalname
                    }
                });
            }
        }
        return results;
    }
    catch (error) {
        console.error('PubMed搜索失败:', error);
        return [];
    }
}
// 聚合搜索 - 带超时和错误处理
export async function multiSourceSearch(query, sources = ['wikipedia', 'arxiv', 'github', 'pubmed']) {
    const searchFunctions = {
        wikipedia: () => searchWikipedia(query, 2),
        arxiv: () => searchArxiv(query, 2),
        github: () => searchGitHub(query, 2),
        pubmed: () => searchPubMed(query, 2),
        crossref: async () => {
            const { searchCrossRef } = await import('./advancedSearch.js');
            return searchCrossRef(query, 2);
        },
        semantic_scholar: async () => {
            const { searchSemanticScholar } = await import('./advancedSearch.js');
            return searchSemanticScholar(query, 2);
        },
        zhihu: async () => {
            const { searchZhihu } = await import('./advancedSearch.js');
            return searchZhihu(query, 2);
        },
        bilibili: async () => {
            const { searchBilibili } = await import('./advancedSearch.js');
            return searchBilibili(query, 2);
        }
    };
    // 使用 Promise.allSettled 确保一个源失败不影响其他源
    const promises = sources
        .filter(source => searchFunctions[source])
        .map(async (source) => {
        try {
            // 添加单个源超时
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Source ${source} timeout`)), 8000);
            });
            const result = await Promise.race([
                searchFunctions[source](),
                timeoutPromise
            ]);
            return result;
        }
        catch (error) {
            console.error(`Source ${source} failed:`, error);
            return [];
        }
    });
    const results = await Promise.all(promises);
    return results.flat();
}
//# sourceMappingURL=externalSearch.js.map