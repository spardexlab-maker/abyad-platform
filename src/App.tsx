
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { Doctor, User, Admin, BeautyCenter, Laboratory } from './types';
import { AppView } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import AuthScreen from './components/LoginForms';
import { PatientApp } from './components/PatientApp';
import DoctorApp from './components/DoctorApp';
import { AdminApp } from './components/AdminApp';
import { BeautyCenterApp } from './components/BeautyCenterApp';
import { LaboratoryApp } from './components/LaboratoryApp';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';


export type Theme = 'light' | 'dark';

function App() {
  const { currentUser, isAuthenticated } = useAuthStore();
  const { currentView, appSettings, goBack, history } = useUiStore();
  
  // Handle Browser Back Button & Android Hardware Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        // Prevent default browser behavior if we can handle it internally
        if (history.length > 0) {
            const success = goBack();
            if (!success) {
                // If we can't go back internally, allow browser exit
            }
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [history, goBack]);

  const renderContent = () => {
    switch (currentView) {
      case AppView.Welcome:
        return <WelcomeScreen />;
      
      case AppView.Login:
      case AppView.Register:
        return <AuthScreen 
                  initialMode={currentView === AppView.Login ? 'login' : 'register'}
               />;
        
      case AppView.PatientHome:
      case AppView.PatientDoctorList:
      case AppView.PatientDoctorProfile:
      case AppView.PatientBookingConfirmation:
      case AppView.PatientAppointments:
      case AppView.PatientProfile:
      case AppView.PatientMedicalRecord:
      case AppView.PatientBeautyCenterList:
      case AppView.PatientBeautyCenterProfile:
      case AppView.PatientBeautyBookingConfirmation:
      case AppView.PatientLabList:
      case AppView.PatientLabProfile:
      case AppView.PatientLabBookingConfirmation:
         return <PatientApp />;
      
      case AppView.DoctorDashboard:
        return isAuthenticated && currentUser?.role === 'doctor' 
            ? <DoctorApp doctor={currentUser as Doctor} appName={appSettings.appName} /> 
            : <AuthScreen initialMode="login" />;
      
      case AppView.BeautyCenterDashboard:
        return isAuthenticated && currentUser?.role === 'beauty_center'
            ? <BeautyCenterApp center={currentUser as BeautyCenter} appName={appSettings.appName} />
            : <AuthScreen initialMode="login" />;
            
      case AppView.LaboratoryDashboard:
        return isAuthenticated && currentUser?.role === 'laboratory'
            ? <LaboratoryApp lab={currentUser as Laboratory} appName={appSettings.appName} />
            : <AuthScreen initialMode="login" />;

      case AppView.AdminDashboard:
         return isAuthenticated && currentUser?.role === 'admin'
            ? <AdminApp 
                admin={currentUser as Admin} 
              />
            : <AuthScreen initialMode="login" />;
            
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    // Applied Safe Area Padding here using Tailwind variables defined in index.html/config
    <div className="min-h-screen font-body bg-surface dark:bg-background text-text-primary dark:text-text-primary transition-colors duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {renderContent()}
    </div>
  );
}

export default App;
