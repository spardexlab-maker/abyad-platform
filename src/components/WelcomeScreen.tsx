
import React from 'react';
import { AppView } from '../types';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './Icons';
import { useUiStore } from '../stores/uiStore';

const WelcomeScreen: React.FC = () => {
  const { navigate, appSettings } = useUiStore();

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background dark:bg-background transition-colors duration-300">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
        {/* الشعار الأساسي المرفوع من الإعدادات */}
        <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl"></div>
            <img 
                src={appSettings.appLogoUrl} 
                alt="App Logo" 
                className="relative w-44 h-44 rounded-[3.5rem] object-cover shadow-2xl border-4 border-white dark:border-gray-900" 
            />
        </div>

        <div className="space-y-3">
            <h1 className="text-4xl font-black text-primary tracking-tighter">{appSettings.appName}</h1>
            <p className="text-lg font-bold text-text-secondary">رفيقك الصحي الذكي</p>
        </div>
        
        <div className="w-full space-y-4 pt-6">
            <button
                onClick={() => navigate(AppView.Login)}
                className="w-full px-4 py-5 font-black text-white bg-primary rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                تسجيل الدخول
            </button>
            <button
                onClick={() => navigate(AppView.Register)}
                className="w-full px-4 py-5 font-black text-primary bg-white border-2 border-primary rounded-[2rem] hover:bg-primary/5 transition-all"
            >
                إنشاء حساب جديد
            </button>
            <button
                onClick={() => navigate(AppView.PatientHome)}
                className="w-full px-4 py-3 font-bold text-text-secondary hover:text-primary transition-colors"
            >
                المتابعة كضيف
            </button>
        </div>
      </div>

      {/* أيقونات التواصل الاجتماعي بدون بار أو خلفية */}
      <div className="pb-10 flex justify-center items-center gap-8">
            <a href={appSettings.socialLinks?.facebook} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors transform hover:scale-110">
                <FacebookIcon className="w-7 h-7" />
            </a>
            <a href={appSettings.socialLinks?.instagram} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors transform hover:scale-110">
                <InstagramIcon className="w-7 h-7" />
            </a>
            <a href={appSettings.socialLinks?.whatsapp} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors transform hover:scale-110">
                <WhatsAppIcon className="w-7 h-7" />
            </a>
      </div>
    </div>
  );
};

export default WelcomeScreen;
