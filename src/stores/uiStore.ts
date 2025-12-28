
import { create } from '../lib/zustand';
import { AppView, Doctor, BeautyCenter, Laboratory, AppSettings } from '../types';
import type { Theme } from '../App';

interface UiState {
  currentView: AppView;
  history: AppView[]; // Navigation Stack
  theme: Theme;
  appSettings: AppSettings;
  selectedDoctor: Doctor | null;
  selectedBeautyCenter: BeautyCenter | null;
  selectedLab: Laboratory | null;
  navigate: (view: AppView, data?: any, replace?: boolean) => void;
  goBack: () => boolean; // Returns true if back navigation handled
  navigateToRoleDefault: (role: string) => void;
  toggleTheme: () => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  _hydrate: () => void;
}

const getInitialView = (): AppView => {
    try {
        const storedView = localStorage.getItem('myDoctorView');
        if (storedView && Number(storedView) > AppView.Register) {
            return Number(storedView) as AppView;
        }
    } catch (e) {}
    return AppView.Welcome;
};

export const useUiStore = create<UiState>((set, get) => ({
  currentView: getInitialView(),
  history: [], 
  theme: 'light',
  
  appSettings: {
    // Rebranded Name: Distinctive Arabic typography concept
    appName: 'أَبْيَض | Abyad',
    appLogoUrl: 'https://i.ibb.co/6gT3jJV/doctor-illustration.png', // You should update this with a white/minimalist logo later
    socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        whatsapp: 'https://wa.me/9647712345678',
    }
  },

  selectedDoctor: null,
  selectedBeautyCenter: null,
  selectedLab: null,

  navigate: (view, data, replace = false) => {
    const currentState = get();
    
    if (currentState.currentView === view) return;

    const stateUpdate: Partial<UiState> = { currentView: view };
    
    // Logic for History Stack (Native Navigation Feel)
    let newHistory = [...currentState.history];
    
    // Don't push to history if replacing (e.g. Tab switch or Redirect)
    // Don't push Login/Welcome to history to avoid getting stuck
    if (!replace && currentState.currentView !== AppView.Welcome && currentState.currentView !== AppView.Login) {
        newHistory.push(currentState.currentView);
    }
    stateUpdate.history = newHistory;

    if (view === AppView.PatientDoctorProfile && data) {
      stateUpdate.selectedDoctor = data as Doctor;
    }
    if (view === AppView.PatientBeautyCenterProfile && data) {
      stateUpdate.selectedBeautyCenter = data as BeautyCenter;
    }
    if (view === AppView.PatientLabProfile && data) {
      stateUpdate.selectedLab = data as Laboratory;
    }
    
    set(stateUpdate);
    localStorage.setItem('myDoctorView', String(view));
    
    // Update Browser History for Android Back Button support
    // Fixed: Wrapped in try-catch and removed strict path usage to prevent SecurityError/DataCloneError in sandboxes/blobs
    try {
        window.history.pushState({ view }, '', null); 
    } catch (e) {
        // Ignore history errors in strict environments (like some WebContainers or Blobs)
        // This ensures the app doesn't crash even if browser history API fails
        console.debug("Navigation history update skipped due to environment restrictions.");
    }
  },

  goBack: () => {
      const state = get();
      if (state.history.length > 0) {
          const previousView = state.history[state.history.length - 1];
          const newHistory = state.history.slice(0, -1);
          set({ currentView: previousView, history: newHistory });
          localStorage.setItem('myDoctorView', String(previousView));
          return true;
      }
      return false;
  },

  navigateToRoleDefault: (role) => {
    set({ history: [] }); // Reset history on new login
    switch (role) {
      case 'admin':
        get().navigate(AppView.AdminDashboard, undefined, true);
        break;
      case 'doctor':
        get().navigate(AppView.DoctorDashboard, undefined, true);
        break;
      case 'beauty_center':
        get().navigate(AppView.BeautyCenterDashboard, undefined, true);
        break;
      case 'laboratory':
        get().navigate(AppView.LaboratoryDashboard, undefined, true);
        break;
      default:
        get().navigate(AppView.PatientHome, undefined, true);
        break;
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    localStorage.setItem('myDoctorTheme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  updateAppSettings: (newSettings: Partial<AppSettings>) => {
    set(state => ({
        appSettings: { ...state.appSettings, ...newSettings }
    }));
  },

  _hydrate: () => {
    try {
        const theme = (localStorage.getItem('myDoctorTheme') as Theme) || 'light';
        set({ theme });
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } catch(e) {
         console.error("Failed to hydrate UI state from localStorage", e);
    }
  }
}));

useUiStore.getState()._hydrate();
