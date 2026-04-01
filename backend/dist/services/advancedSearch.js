import axios from 'axios';
// 百度学术搜索 (需要爬虫或第三方API)
export async function searchBaiduScholar(query, limit = 5) {
    try {
        // 注意：百度学术没有官方API，这里使用 SerpAPI 或其他第三方服务
        // 需要配置 SERPAPI_KEY
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) {
            console.log('SERPAPI_KEY 未配置，跳过百度学术搜索');
            return [];
        }
        const res = await axios.get('https://serpapi.com/search', {
            params: {
                engine: 'baidu_scholar',
                q: query,
                api_key: apiKey,
                num: limit
            }
        });
        return res.data.organic_results?.map((item) => ({
            source: 'baidu_scholar',
            title: item.title,
            content: item.snippet || item.abstract || '',
            url: item.link,
            metadata: {
                authors: item.authors,
                cited: item.cited_by?.total,
                year: item.year
            }
        })) || [];
    }
    catch (error) {
        console.error('百度学术搜索失败:', error);
        return [];
    }
}
// Google Scholar 搜索 (需要 SerpAPI 或类似服务)
export async function searchGoogleScholar(query, limit = 5) {
    try {
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) {
            console.log('SERPAPI_KEY 未配置，跳过 Google Scholar 搜索');
            return [];
        }
        const res = await axios.get('https://serpapi.com/search', {
            params: {
                engine: 'google_scholar',
                q: query,
                api_key: apiKey,
                num: limit
            }
        });
        return res.data.organic_results?.map((item) => ({
            source: 'google_scholar',
            title: item.title,
            content: item.snippet || item.abstract || '',
            url: item.link,
            metadata: {
                authors: item.authors?.map((a) => a.name).join(', '),
                cited: item.cited_by?.total,
                year: item.year
            }
        })) || [];
    }
    catch (error) {
        console.error('Google Scholar 搜索失败:', error);
        return [];
    }
}
// CrossRef 学术文献搜索 (免费API)
export async function searchCrossRef(query, limit = 5) {
    try {
        const res = await axios.get('https://api.crossref.org/works', {
            params: {
                query: query,
                rows: limit,
                sort: 'relevance',
                order: 'desc'
            },
            headers: {
                'User-Agent': 'Nexus Knowledge Graph (mailto:contact@example.com)'
            }
        });
        return res.data.message.items.map((item) => ({
            source: 'crossref',
            title: item.title?.[0] || 'Untitled',
            content: item.abstract || `Type: ${item.type}, Published: ${item['published-print']?.['date-parts']?.[0]?.[0] || 'Unknown'}`,
            url: item.URL,
            metadata: {
                authors: item.author?.slice(0, 3).map((a) => `${a.given || ''} ${a.family || ''}`).join(', '),
                year: item['published-print']?.['date-parts']?.[0]?.[0],
                citations: item['is-referenced-by-count'],
                type: item.type
            }
        }));
    }
    catch (error) {
        console.error('CrossRef 搜索失败:', error);
        return [];
    }
}
// Semantic Scholar 学术搜索 (免费API)
export async function searchSemanticScholar(query, limit = 5) {
    try {
        const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
            params: {
                query: query,
                limit: limit,
                fields: 'title,abstract,year,authors,citationCount,url'
            }
        });
        return res.data.data?.map((item) => ({
            source: 'semantic_scholar',
            title: item.title,
            content: item.abstract || '',
            url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
            metadata: {
                authors: item.authors?.slice(0, 3).map((a) => a.name).join(', '),
                year: item.year,
                citations: item.citationCount
            }
        })) || [];
    }
    catch (error) {
        console.error('Semantic Scholar 搜索失败:', error);
        return [];
    }
}
// CORE 学术论文搜索 (免费API，需要API Key)
export async function searchCore(query, limit = 5) {
    try {
        const apiKey = process.env.CORE_API_KEY;
        if (!apiKey) {
            console.log('CORE_API_KEY 未配置，跳过 CORE 搜索');
            return [];
        }
        const res = await axios.get('https://api.core.ac.uk/v3/search/works', {
            params: {
                q: query,
                limit: limit
            },
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        return res.data.results?.map((item) => ({
            source: 'core',
            title: item.title,
            content: item.abstract || item.description || '',
            url: item.links?.[0] || item.downloadUrl || '',
            metadata: {
                authors: item.authors?.slice(0, 3).map((a) => a.name).join(', '),
                year: item.yearPublished,
                citations: item.citationCount,
                publisher: item.publisher
            }
        })) || [];
    }
    catch (error) {
        console.error('CORE 搜索失败:', error);
        return [];
    }
}
// 中国知网 CNKI (需要机构访问或爬虫)
export async function searchCNKI(query, limit = 5) {
    // 知网没有公开API，需要:
    // 1. 机构VPN访问
    // 2. 购买API服务
    // 3. 爬虫（有法律风险）
    console.log('知网搜索需要机构访问权限，暂不支持');
    return [];
}
// 万方数据库 (需要机构访问)
export async function searchWanfang(query, limit = 5) {
    // 万方同样没有公开API
    console.log('万方数据库需要机构访问权限，暂不支持');
    return [];
}
// 知乎搜索 (需要爬虫)
export async function searchZhihu(query, limit = 5) {
    try {
        // 使用知乎的公开搜索API（非官方，可能不稳定）
        const res = await axios.get('https://www.zhihu.com/api/v4/search_v3', {
            params: {
                t: 'general',
                q: query,
                offset: 0,
                limit: limit
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return res.data.data?.map((item) => {
            const content = item.object || {};
            return {
                source: 'zhihu',
                title: content.title || content.question?.name || '知乎内容',
                content: content.excerpt || content.content || '',
                url: `https://zhihu.com/${content.type}/${content.id}`,
                metadata: {
                    author: content.author?.name,
                    votes: content.voteup_count,
                    comments: content.comment_count
                }
            };
        }) || [];
    }
    catch (error) {
        console.error('知乎搜索失败:', error);
        return [];
    }
}
// 哔哩哔哩搜索 (视频教程)
export async function searchBilibili(query, limit = 5) {
    try {
        const res = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
            params: {
                keyword: query,
                search_type: 'video',
                page: 1,
                pagesize: limit
            }
        });
        return res.data.data?.result?.map((item) => ({
            source: 'bilibili',
            title: item.title.replace(/<[^>]+>/g, ''), // 去除HTML标签
            content: item.description || '',
            url: `https://bilibili.com/video/${item.bvid}`,
            metadata: {
                author: item.author,
                views: item.play,
                duration: item.duration,
                tags: item.tag?.split(',')
            }
        })) || [];
    }
    catch (error) {
        console.error('Bilibili 搜索失败:', error);
        return [];
    }
}
// 豆瓣读书搜索
export async function searchDoubanBooks(query, limit = 5) {
    try {
        // 豆瓣API已关闭，使用公开搜索页面或第三方服务
        console.log('豆瓣API已关闭，暂不支持');
        return [];
    }
    catch (error) {
        console.error('豆瓣搜索失败:', error);
        return [];
    }
}
// 导出所有高级搜索函数
export const advancedSearchSources = {
    baiduScholar: searchBaiduScholar,
    googleScholar: searchGoogleScholar,
    crossRef: searchCrossRef,
    semanticScholar: searchSemanticScholar,
    core: searchCore,
    cnki: searchCNKI,
    wanfang: searchWanfang,
    zhihu: searchZhihu,
    bilibili: searchBilibili,
    doubanBooks: searchDoubanBooks
};
//# sourceMappingURL=advancedSearch.js.map