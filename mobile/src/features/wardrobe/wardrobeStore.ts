// 衣橱列表 Store:衣物数据 + 筛选 + 搜索
import { create } from 'zustand';
import { container, TOKENS } from '../../infra/di/container';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { IAssetStore } from '../../domain/repositories/IAssetStore';
import type { Clothing } from '../../domain/entities/Clothing';

interface WardrobeState {
  items: Clothing[];
  loading: boolean;
  keyword: string;
  selectedTagIds: string[];
  // 图片路径缓存(相对路径 → file:// 绝对路径)
  uriCache: Record<string, string>;
  // 是否还有更多(本阶段简单实现:一次加载全部)
  hasMore: boolean;

  setKeyword: (k: string) => void;
  toggleTag: (id: string) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  getUri: (relPath: string) => Promise<string>;
  removeLocal: (id: string) => Promise<void>;
}

// 延迟获取 repo,避免模块加载顺序导致 initBindings 还没执行
const getRepo = () => container.get<IClothingRepository>(TOKENS.IClothingRepository);
const getAsset = () => container.get<IAssetStore>(TOKENS.IAssetStore);

export const useWardrobeStore = create<WardrobeState>((set, get) => {
  return {
    items: [],
    loading: false,
    keyword: '',
    selectedTagIds: [],
    uriCache: {},
    hasMore: false,

    setKeyword: (k) => set({ keyword: k }),

    toggleTag: (id) =>
      set((s) => {
        const next = new Set(s.selectedTagIds);
        next.has(id) ? next.delete(id) : next.add(id);
        return { selectedTagIds: Array.from(next) };
      }),

    clearFilters: () => set({ keyword: '', selectedTagIds: [] }),

    refresh: async () => {
      set({ loading: true });
      try {
        const { keyword, selectedTagIds } = get();
        const items = await getRepo().list({
          keyword: keyword || undefined,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        set({ items, hasMore: false });
      } finally {
        set({ loading: false });
      }
    },

    getUri: async (relPath) => {
      const cache = get().uriCache;
      if (cache[relPath]) return cache[relPath];
      const abs = await getAsset().getPublicUrl(relPath);
      set((s) => ({ uriCache: { ...s.uriCache, [relPath]: abs } }));
      return abs;
    },

    removeLocal: async (id) => {
      set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
    },
  };
});
