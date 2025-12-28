
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { AppView } from '../types';
import { ChevronRightIcon } from './Icons';

interface AuthScreenProps {
  initialMode: 'login' | 'register';
}

type AuthFlowMode = 'auth' | 'reset';
type ResetStep = 'request' | 'verify' | 'reset';

const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [authFlowMode, setAuthFlowMode] = useState<AuthFlowMode>('auth');
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, register, loginWithGoogle, sendRegistrationOtp, sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword } = useAuthStore();
  const { navigate, appSettings } = useUiStore();

  const [loginContactInfo, setLoginContactInfo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [fullPhoneNumberForOtp, setFullPhoneNumberForOtp] = useState('');

  const [resetContactInfo, setResetContactInfo] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const isLogin = mode === 'login';

  const handleGoogleLogin = async () => {
      setIsLoading(true);
      setError(null);
      try {
          await loginWithGoogle();
          // Note: If using Supabase, this will redirect away. 
          // If mock, it will just log in.
      } catch (err: any) {
          setError(err.message || 'فشل تسجيل الدخول باستخدام جوجل.');
          setIsLoading(false);
      }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (regPassword !== regConfirmPassword) {
        setError('كلمات المرور غير متطابقة.');
        setIsLoading(false);
        return;
    }

    let cleanNumber = regPhoneNumber.replace(/[^0-9]/g, '');
    const phoneRegex = /^(0?7[3-9]\d{8})$/;

    if (!phoneRegex.test(cleanNumber)) {
        setError('الرجاء إدخال رقم هاتف عراقي صالح (مثال: 0770xxxxxxx).');
        setIsLoading(false);
        return;
    }

    if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
    }
    
    const fullPhoneNumber = `+964${cleanNumber}`;
    setFullPhoneNumberForOtp(fullPhoneNumber);
    
    try {
        await sendRegistrationOtp(fullPhoneNumber);
        setStep('otp');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
        await register({ name: regName, password: regPassword, phoneNumber: fullPhoneNumberForOtp, email: regEmail, otp });
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
        await login(loginContactInfo, loginPassword);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRequestResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetOtp(resetContactInfo);
      setResetStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await verifyPasswordResetOtp(resetContactInfo, resetOtp);
      setResetStep('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('كلمات المرور الجديدة غير متطابقة.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(resetContactInfo, resetOtp, newPassword);
      alert('تم تحديث كلمة المرور بنجاح!');
      setAuthFlowMode('auth');
      setMode('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthForms = () => {
    const title = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
    return (
        <div className="bg-background dark:bg-surface rounded-[2.5rem] shadow-2xl p-8 border border-gray-50 dark:border-gray-800">
            <div className="text-center mb-8">
                {/* استخدام اللوجو الأساسي المرفوع */}
                <img src={appSettings.appLogoUrl} alt="App Logo" className="w-20 h-20 mx-auto mb-4 rounded-3xl object-cover shadow-lg" />
                <h1 className="text-2xl font-black text-primary tracking-tighter">{title}</h1>
            </div>
            
            {mode === 'register' && step === 'otp' ? (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div className="text-center text-sm font-bold text-text-secondary">أدخل رمز التحقق المرسل إلى <br/><span dir="ltr">{fullPhoneNumberForOtp}</span></div>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="w-full tracking-[1em] text-center p-4 bg-surface dark:bg-background border-border border rounded-2xl focus:ring-2 focus:ring-primary outline-none" required dir="ltr" autoFocus placeholder="------"/>
                    {error && <p className="text-error text-xs text-center font-bold">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-4 font-black text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 transition-transform active:scale-95">{isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}</button>
                    <button type="button" onClick={() => setStep('details')} className="w-full text-xs font-bold text-text-secondary hover:text-primary">تعديل البيانات</button>
                </form>
            ) : (
                <form onSubmit={isLogin ? handleLoginSubmit : handleRegistrationSubmit} className="space-y-4">
                    {!isLogin && (
                        <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary transition-colors" placeholder="الاسم الكامل" required />
                    )}
                    <input 
                        type="text" 
                        value={isLogin ? loginContactInfo : regPhoneNumber} 
                        onChange={(e) => isLogin ? setLoginContactInfo(e.target.value) : setRegPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                        className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary transition-colors" 
                        placeholder={isLogin ? "البريد الإلكتروني أو رقم الهاتف" : "رقم الهاتف (مثال: 0770xxxxxxx)"} 
                        required 
                        dir="ltr"
                        inputMode={!isLogin ? "numeric" : "text"}
                    />
                    <input type="password" value={isLogin ? loginPassword : regPassword} onChange={(e) => isLogin ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)} className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary transition-colors" placeholder="كلمة المرور" required />
                    {!isLogin && (
                        <input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary transition-colors" placeholder="تأكيد كلمة المرور" required />
                    )}
                    
                    {error && <p className="text-error text-xs text-center font-bold animate-pulse">{error}</p>}
                    
                    {isLogin && (
                        <div className="text-left"><button type="button" onClick={() => setAuthFlowMode('reset')} className="text-xs font-bold text-primary hover:underline">نسيت كلمة المرور؟</button></div>
                    )}

                    <button id="loginBtn" type="submit" disabled={isLoading} className="w-full py-5 font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                        {isLoading ? 'جاري المعالجة...' : (isLogin ? 'دخول' : 'متابعة')}
                    </button>

                    <button type="button" onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(null); }} className="w-full text-sm font-bold text-text-secondary pt-2 hover:text-primary transition-colors">
                        {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخول'}
                    </button>
                    
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-4 text-text-secondary text-xs font-bold uppercase">أو</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>
                    
                    {/* زر تسجيل الدخول عبر جوجل المحدث لـ Supabase */}
                    <button 
                        type="button" 
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-surface border border-border rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-background transition-all active:scale-95"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                        <span className="font-bold text-text-primary text-sm">
                            {isLogin ? 'تسجيل الدخول عبر Google' : 'التسجيل عبر Google'}
                        </span>
                    </button>
                </form>
            )}
        </div>
    );
  };
  
  const renderPasswordResetForms = () => {
    return (
        <div className="bg-background dark:bg-surface rounded-[2.5rem] shadow-2xl p-8 border border-gray-50 dark:border-gray-800">
            <div className="text-center mb-8">
                <img src={appSettings.appLogoUrl} alt="App Logo" className="w-20 h-20 mx-auto mb-4 rounded-3xl object-cover shadow-lg" />
                <h1 className="text-2xl font-black text-primary tracking-tighter">استعادة الحساب</h1>
            </div>
            {resetStep === 'request' && (
                <form onSubmit={handleRequestResetSubmit} className="space-y-4">
                    <p className="text-sm font-bold text-text-secondary text-center mb-4">أدخل رقم الهاتف أو البريد الإلكتروني المرتبط بحسابك لاستلام رمز التحقق.</p>
                    <input type="text" value={resetContactInfo} onChange={(e) => setResetContactInfo(e.target.value)} className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary" placeholder="البريد أو رقم الهاتف" required dir="ltr"/>
                    {error && <p className="text-error text-xs text-center font-bold">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-4 font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95">{isLoading ? 'جاري الإرسال...' : 'إرسال الرمز'}</button>
                </form>
            )}
            {resetStep === 'verify' && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                    <p className="text-sm font-bold text-text-secondary text-center">أدخل الرمز المرسل إلى {resetContactInfo}</p>
                    <input type="text" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} maxLength={6} className="w-full tracking-[1em] text-center p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary" required dir="ltr"/>
                    {error && <p className="text-error text-xs text-center font-bold">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-4 font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95">{isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}</button>
                </form>
            )}
            {resetStep === 'reset' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary" placeholder="كلمة المرور الجديدة" required />
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full p-4 bg-surface dark:bg-background border-border border rounded-2xl outline-none focus:border-primary" placeholder="تأكيد كلمة المرور" required />
                    {error && <p className="text-error text-xs text-center font-bold">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-4 font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95">{isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</button>
                </form>
            )}
            <button type="button" onClick={() => { setAuthFlowMode('auth'); setError(null); }} className="w-full text-sm font-bold text-text-secondary mt-6 hover:text-primary transition-colors">العودة لتسجيل الدخول</button>
        </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-background p-4 transition-colors duration-300">
        <div className="w-full max-w-md mx-auto">
            <button onClick={() => navigate(AppView.Welcome)} className="text-xs font-black text-text-secondary hover:text-primary mb-6 transition-colors flex items-center gap-2">
                <ChevronRightIcon className="w-4 h-4 rotate-180" /> العودة للرئيسية
            </button>
            {authFlowMode === 'auth' ? renderAuthForms() : renderPasswordResetForms()}
        </div>
    </div>
  );
};

export default AuthScreen;
