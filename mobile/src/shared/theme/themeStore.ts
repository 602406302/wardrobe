// 主题 Store:亮/暗切换,持久化到 AsyncStorage
// 注:DESIGN.md 暂无暗色 token,这里用简化版暗色值
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// 简化版主题色板(未来从 DESIGN.md token 完整映射)
export const themeColors = {
  light: {
    surface: '#f9f9fc',
    surfaceVariant: '#f0f0f5',
    onSurface: '#1a1a2e',
    onSurfaceVariant: '#757684',
    primary: '#24389c',
    outline: '#e2e2e5',
    card: '#ffffff',
  },
  dark: {
    surface: '#0f0f1a',
    surfaceVariant: '#1a1a2e',
    onSurface: '#f9f9fc',
    onSurfaceVariant: '#a0a0b0',
    primary: '#6b7eff',
    outline: '#2a2a3e',
    card: '#1a1a2e',
  },
} as const;

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  return { mode, colors: themeColors[mode] };
}
