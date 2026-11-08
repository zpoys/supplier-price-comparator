import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000,
});

export const Cache = {
  set<T>(key: string, data: T): void {
    cache.set(key, data);
  },

  get<T>(key: string): T | undefined {
    return cache.get(key) as T | undefined;
  },

  has(key: string): boolean {
    return cache.has(key);
  },

  delete(key: string): boolean {
    return cache.delete(key);
  },

  clear(): void {
    cache.clear();
  },
};
