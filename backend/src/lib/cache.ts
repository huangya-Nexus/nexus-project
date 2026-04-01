import NodeCache from 'node-cache'

// 创建缓存实例 - 5分钟过期
const searchCache = new NodeCache({ stdTTL: 300, checkperiod: 60 })

export function getCachedSearch(key: string): any | undefined {
  return searchCache.get(key)
}

export function setCachedSearch(key: string, data: any): void {
  searchCache.set(key, data)
}

export function clearSearchCache(): void {
  searchCache.flushAll()
}

// 生成缓存key
export function generateCacheKey(source: string, query: string): string {
  return `${source}:${query.toLowerCase().trim()}`
}
