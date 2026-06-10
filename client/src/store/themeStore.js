import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',

  initTheme: () => {
    const saved = localStorage.getItem('theme') || 'dark';
    set({ theme: saved });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const themes = ['dark', 'light', 'amoled'];
      const currentIndex = themes.indexOf(state.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      localStorage.setItem('theme', nextTheme);
      return { theme: nextTheme };
    });
  }
}));
