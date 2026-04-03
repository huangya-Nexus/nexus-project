import NodeCache from 'node-cache';
// 创建缓存实例 - 5分钟过期
const searchCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
export function getCachedSearch(key) {
    return searchCache.get(key);
}
export function setCachedSearch(key, data) {
    searchCache.set(key, data);
}
export function clearSearchCache() {
    searchCache.flushAll();
}
// 生成缓存key
export function generateCacheKey(source, query) {
    return `${source}:${query.toLowerCase().trim()}`;
}
//# sourceMappingURL=cache.js.map