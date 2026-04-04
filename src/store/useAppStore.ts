import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isSamjhoActive: boolean;
  toggleSamjho: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isSamjhoActive: false,
  toggleSamjho: () => set((state) => ({ isSamjhoActive: !state.isSamjhoActive })),
}));
