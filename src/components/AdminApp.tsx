
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Admin, Doctor, ActivityLog, Review, AppSettings, BeautyCenter, BeautyService, Laboratory, LabTest, User } from '../types';
import { UsersIcon, MegaphoneIcon, ShieldCheckIcon, LogoutIcon, SearchIcon, BellIcon, ClockIcon, StarIcon, SunIcon, MoonIcon, Cog6ToothIcon, MenuIcon, SparklesIcon, PlusCircleIcon, TrashIcon, BeakerIcon, ClipboardListIcon, PhotoIcon } from './Icons';
import * as api from '../services/apiService';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

// Let TypeScript know about the Leaflet global object
declare var L: any;

type AdminView = 'doctors' | 'beauty_centers' | 'laboratories' | 'patients' | 'home_management' | 'reviews' | 'monitoring' | 'settings';

const LocationPickerMap: React.FC<{
    initialLocation: [number, number];
    onLocationChange: (lat: number, lng: number) => void;
}> = ({ initialLocation, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (typeof L === 'undefined') return; // Safety check for Leaflet

        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView(initialLocation, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            mapInstanceRef.current = map;

            const marker = L.marker(initialLocation, { draggable: true }).addTo(map);
            marker.on('dragend', (event: any) => {
                const { lat, lng } = event.target.getLatLng();
                onLocationChange(lat, lng);
            });

            map.on('click', (event: any) => {
                const { lat, lng } = event.latlng;
                marker.setLatLng([lat, lng]);
                onLocationChange(lat, lng);
            });
        }
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [initialLocation, onLocationChange]);

    return <div ref={mapContainerRef} className="h-64 w-full rounded-lg shadow-inner border border-border" />;
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    confirmColor?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'تأكيد', cancelText = 'إلغاء', isConfirming = false, confirmColor = 'bg-primary hover:opacity-90' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-background dark:bg-surface p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <p className="text-text-secondary mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} disabled={isConfirming} className="px-6 py-2 bg-surface dark:bg-background rounded-lg hover:bg-border">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} disabled={isConfirming} className={`px-6 py-2 text-white font-bold rounded-lg disabled:bg-text-secondary ${confirmColor}`}>
                        {isConfirming ? '...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PatientFormModal: React.FC<{
    onSave: (patientData: Partial<User>, patientId: string) => void;
    onClose: () => void;
    initialPatient: User | null;
}> = ({ onSave, onClose, initialPatient }) => {
    if (!initialPatient) return null;

    const [formData, setFormData] = useState({
        name: initialPatient.name || '',
        email: initialPatient.email || '',
        phoneNumber: initialPatient.phoneNumber || '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { password, ...rest } = formData;
        const dataToSave: Partial<User> = rest;
        if (password) {
            dataToSave.password = password;
        }
        onSave(dataToSave, initialPatient.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 flex justify-center items-center">
            <div className="bg-background dark:bg-surface p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">تعديل بيانات المريض</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block font-bold mb-1">الاسم</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
                    <div><label className="block font-bold mb-1">البريد الإلكتروني</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                    <div><label className="block font-bold mb-1">رقم الهاتف</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                    <div><label className="block font-bold mb-1">كلمة المرور الجديدة</label><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" placeholder="اتركه فارغاً لعدم التغيير" /></div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-surface dark:bg-background rounded-lg">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg">حفظ التغييرات</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PatientManager: React.FC = () => {
    const [patients, setPatients] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ type: 'edit' | 'delete', isOpen: boolean, patient: User | null }>({ type: 'edit', isOpen: false, patient: null });

    const fetchPatients = async () => {
        setIsLoading(true);
        const response = await api.fetchAllPatients();
        if (response.ok) {
            setPatients(await response.json());
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPatients();
    }, []);
    
    const filteredPatients = useMemo(() => {
        if (!searchQuery) return patients;
        return patients.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.phoneNumber && p.phoneNumber.includes(searchQuery))
        );
    }, [searchQuery, patients]);
    
    const handleSavePatient = async (patientData: Partial<User>, patientId: string) => {
        await api.updatePatientByAdmin(patientId, patientData);
        setModalState({ type: 'edit', isOpen: false, patient: null });
        fetchPatients();
    };

    const handleStatusChange = async (patientId: string, newStatus: 'active' | 'disabled') => {
        await api.updatePatientStatusByAdmin(patientId, newStatus);
        fetchPatients();
    };

    const handleDeletePatient = async () => {
        if(modalState.patient) {
            await api.deletePatientByAdmin(modalState.patient.id);
            setModalState({ type: 'delete', isOpen: false, patient: null });
            fetchPatients();
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إدارة المرضى</h1>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                 <div className="relative mb-4"><input type="text" placeholder="...البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-surface dark:bg-background rounded-lg py-3 px-4 pr-12 text-right border border-border" /><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" /></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b border-border"><tr><th className="p-3">الاسم</th><th className="p-3">بيانات الاتصال</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead>
                        <tbody>
                            {isLoading ? (<tr><td colSpan={4} className="text-center p-4">جاري التحميل...</td></tr>) :
                            filteredPatients.map(patient => (<tr key={patient.id} className="border-b border-border hover:bg-surface dark:hover:bg-background transition-colors">
                            <td className="p-3 font-semibold">{patient.name}</td>
                            <td className="p-3 text-text-secondary text-sm">{patient.email || 'N/A'}<br/>{patient.phoneNumber || 'N/A'}</td>
                            <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{patient.status === 'active' ? 'نشط' : 'معطل'}</span></td>
                            <td className="p-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setModalState({ type: 'edit', isOpen: true, patient: patient })} className="text-sm font-semibold text-primary hover:underline">تعديل</button>
                                    <span className="text-border">|</span>
                                    <button onClick={() => handleStatusChange(patient.id, patient.status === 'active' ? 'disabled' : 'active')} className="text-sm font-semibold text-primary hover:underline">تغيير الحالة</button>
                                    <span className="text-border">|</span>
                                    <button onClick={() => setModalState({ type: 'delete', isOpen: true, patient: patient })} className="text-sm font-semibold text-error hover:underline">حذف</button>
                                </div>
                            </td>
                        </tr>))}</tbody>
                    </table>
                </div>
            </div>
            {modalState.isOpen && modalState.type === 'edit' && <PatientFormModal onSave={handleSavePatient} onClose={() => setModalState({ isOpen: false, patient: null, type: 'edit' })} initialPatient={modalState.patient} />}
            {modalState.isOpen && modalState.type === 'delete' && (
                <ConfirmationModal 
                    isOpen={true}
                    title="تأكيد الحذف"
                    message={`هل أنت متأكد من حذف حساب المريض ${modalState.patient?.name}؟ هذا الإجراء لا يمكن التراجع عنه.`}
                    onConfirm={handleDeletePatient}
                    onCancel={() => setModalState({ isOpen: false, patient: null, type: 'delete' })}
                    confirmText="نعم، حذف"
                    confirmColor="bg-error hover:opacity-90"
                />
            )}
        </div>
    );
};


export const AdminApp: React.FC<{ 
    admin: Admin; 
}> = () => {
    const { logout } = useAuthStore();
    const { theme, toggleTheme, appSettings, updateAppSettings } = useUiStore();
    const [currentView, setCurrentView] = useState<AdminView>('doctors');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleNavItemClick = (view: AdminView) => {
        setCurrentView(view);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'doctors': return <DoctorManager />;
            case 'beauty_centers': return <BeautyCenterManager />;
            case 'laboratories': return <LaboratoryManager />;
            case 'patients': return <PatientManager />;
            case 'home_management': return <HomePageManager />;
            case 'reviews': return <ReviewsManager />;
            case 'monitoring': return <SystemMonitor />;
            case 'settings': return <GeneralSettingsView currentSettings={appSettings} onSave={updateAppSettings} />;
            default: return <div>Select a view</div>;
        }
    };

    return (
        <div className="flex h-screen bg-surface dark:bg-background text-text-primary transition-colors duration-300">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`w-64 flex-shrink-0 bg-background dark:bg-surface border-l dark:border-border flex flex-col fixed md:relative inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                <div className="h-16 flex items-center justify-center border-b border-border px-4"><h1 className="text-2xl font-bold text-primary truncate">{appSettings.appName}</h1></div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={UsersIcon} label="إدارة الأطباء" active={currentView === 'doctors'} onClick={() => handleNavItemClick('doctors')} />
                    <NavItem icon={SparklesIcon} label="إدارة مراكز التجميل" active={currentView === 'beauty_centers'} onClick={() => handleNavItemClick('beauty_centers')} />
                    <NavItem icon={BeakerIcon} label="إدارة المختبرات" active={currentView === 'laboratories'} onClick={() => handleNavItemClick('laboratories')} />
                    <NavItem icon={ClipboardListIcon} label="إدارة المرضى" active={currentView === 'patients'} onClick={() => handleNavItemClick('patients')} />
                    <NavItem icon={MegaphoneIcon} label="إدارة الرئيسية" active={currentView === 'home_management'} onClick={() => handleNavItemClick('home_management')} />
                    <NavItem icon={StarIcon} label="إدارة التقييمات" active={currentView === 'reviews'} onClick={() => handleNavItemClick('reviews')} />
                    <NavItem icon={ShieldCheckIcon} label="المراقبة" active={currentView === 'monitoring'} onClick={() => handleNavItemClick('monitoring')} />
                    <NavItem icon={Cog6ToothIcon} label="الإعدادات العامة" active={currentView === 'settings'} onClick={() => handleNavItemClick('settings')} />
                </nav>
                 <div className="p-4 border-t border-border">
                     <button onClick={toggleTheme} className="w-full flex items-center justify-center px-4 py-2 mb-2 text-text-secondary rounded-lg hover:bg-surface dark:hover:bg-background transition-colors">
                        {theme === 'light' ? <MoonIcon className="w-5 h-5 ml-3" /> : <SunIcon className="w-5 h-5 ml-3" />}
                        {theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
                    </button>
                    <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2 text-text-secondary rounded-lg hover:bg-error/10 hover:text-error transition-colors"><LogoutIcon className="w-5 h-5 ml-3" />تسجيل الخروج</button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 flex-shrink-0 bg-background dark:bg-surface border-b border-border flex items-center justify-end px-4 md:px-8">
                    <button className="md:hidden text-text-secondary" onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8"><div className="fade-in">{renderContent()}</div></main>
            </div>
        </div>
    );
};

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: React.ElementType, label: string, active: boolean, onClick: () => void }) => (<a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-4 py-2 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-surface dark:hover:bg-background'}`}><Icon className="w-5 h-5 ml-3" />{label}</a>);

const DoctorManager: React.FC = () => {
    const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ isOpen: boolean; doctor: Doctor | null }>({ isOpen: false, doctor: null });

    const fetchDocs = async () => {
        setIsLoading(true);
        const response = await api.fetchAllDoctors();
        if (response.ok) {
            setAllDoctors(await response.json());
        }
        setIsLoading(false);
    };

    useEffect(() => { 
        fetchDocs();
    }, []);
    
    const filteredDoctors = useMemo(() => {
        if (!searchQuery) return allDoctors;
        return allDoctors.filter(d => 
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.governorate.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, allDoctors]);
    
    const handleSaveDoctor = async (doctorData: Partial<Doctor>, doctorId?: string) => { 
        if (doctorId) {
            await api.updateDoctorByAdmin(doctorId, doctorData);
        } else {
            await api.addDoctorByAdmin(doctorData as any);
        }
        setModalState({ isOpen: false, doctor: null });
        fetchDocs();
    };
    
    const handleStatusChange = async (doctorId: string, newStatus: 'active' | 'disabled') => { 
        await api.updateDoctorStatus(doctorId, newStatus); 
        fetchDocs();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">إدارة الأطباء</h1><button onClick={() => setModalState({ isOpen: true, doctor: null })} className="bg-primary text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">إضافة طبيب +</button></div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                 <div className="relative mb-4"><input type="text" placeholder="...البحث بالاسم، التخصص أو المحافظة" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-surface dark:bg-background rounded-lg py-3 px-4 pr-12 text-right border border-border" /><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" /></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b border-border"><tr><th className="p-3">الاسم</th><th className="p-3">التخصص</th><th className="p-3">المحافظة</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead>
                        <tbody>
                            {isLoading ? (<tr><td colSpan={5} className="text-center p-4">جاري التحميل...</td></tr>) :
                            filteredDoctors.map(doctor => (<tr key={doctor.id} className="border-b border-border hover:bg-surface dark:hover:bg-background transition-colors">
                            <td className="p-3 font-semibold">{doctor.name}</td>
                            <td className="p-3 text-text-secondary">{doctor.specialty}</td>
                            <td className="p-3 text-text-secondary">{doctor.governorate}</td>
                            <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${doctor.status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{doctor.status === 'active' ? 'نشط' : 'معطل'}</span></td>
                            <td className="p-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setModalState({ isOpen: true, doctor: doctor })} className="text-sm font-semibold text-primary hover:underline">
                                        تعديل
                                    </button>
                                    <span className="text-border">|</span>
                                    <button onClick={() => handleStatusChange(doctor.id, doctor.status === 'active' ? 'disabled' : 'active')} className="text-sm font-semibold text-primary hover:underline">
                                        تغيير الحالة
                                    </button>
                                </div>
                            </td>
                        </tr>))}</tbody>
                    </table>
                </div>
            </div>
            {modalState.isOpen && <DoctorFormModal onSave={handleSaveDoctor} onClose={() => setModalState({ isOpen: false, doctor: null })} initialDoctor={modalState.doctor} />}
        </div>
    );
};

const iraqiGovernorates = ['بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'ذي قار', 'كركوك', 'الأنبار', 'ديالى', 'المثنى', 'القادسية', 'ميسان', 'واسط', 'صلاح الدين', 'دهوك', 'السليمانية', 'بابل', 'كربلاء'];

const DoctorFormModal: React.FC<{
    onSave: (doctorData: Partial<Doctor>, doctorId?: string) => void;
    onClose: () => void;
    initialDoctor?: Doctor | null;
}> = ({ onSave, onClose, initialDoctor }) => {
    const isEditMode = !!initialDoctor;
    const [specialties, setSpecialties] = useState<string[]>([]);
    
    const [formData, setFormData] = useState({
        name: initialDoctor?.name || '',
        email: initialDoctor?.email || '',
        password: '',
        specialty: initialDoctor?.specialty || '',
        governorate: initialDoctor?.governorate || 'بغداد',
        experienceYears: initialDoctor?.experienceYears || 5,
        location: initialDoctor?.location || '',
        lat: initialDoctor?.lat || 33.3152,
        lng: initialDoctor?.lng || 44.3661,
        bio: initialDoctor?.bio || '',
        consultationFee: initialDoctor?.consultationFee || 40000,
        phoneNumber: initialDoctor?.phoneNumber || '',
        certifications: (initialDoctor?.certifications || []).join(', '),
        status: initialDoctor?.status || 'active',
        profilePicture: initialDoctor?.profilePicture || 'https://i.ibb.co/6gT3jJV/doctor-illustration.png'
    });

    useEffect(() => {
        const predefinedSpecialties = [
            'طب الأسنان', 'الأمراض الجلدية', 'طب الأطفال', 'الطب الباطني',
            'طب العيون', 'أمراض النساء والتوليد', 'جراحة العظام', 'أمراض القلب',
            'الأنف والأذن والحنجرة', 'الجراحة العامة'
        ];

        const fetchSpecs = async () => {
            try {
                const response = await api.getSpecialties();
                if (response.ok) {
                    const fetchedSpecialties = await response.json();
                    const combined = Array.from(new Set([...predefinedSpecialties, ...fetchedSpecialties]));
                    setSpecialties(combined);
                } else {
                    setSpecialties(predefinedSpecialties);
                }
            } catch (error) {
                setSpecialties(predefinedSpecialties);
            }
        };
        fetchSpecs();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'experienceYears' || name === 'consultationFee') ? Number(value) : value
        }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleLocationChange = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { certifications, password, ...rest } = formData;
        const certsArray = certifications.split(',').map(c => c.trim()).filter(Boolean);
        const dataToSave: Partial<Doctor> = { ...rest, certifications: certsArray };
        if (password) dataToSave.password = password;
        onSave(dataToSave, initialDoctor?.id);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 pt-8 flex justify-center items-start">
        <div className="bg-background dark:bg-surface p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div><label className="block font-bold mb-1">الاسم الكامل</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
              <div><label className="block font-bold mb-1">البريد الإلكتروني</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
              <div><label className="block font-bold mb-1">كلمة المرور</label><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" placeholder={isEditMode ? 'اتركه فارغاً لعدم التغيير' : 'كلمة المرور الأولية'} required={!isEditMode} /></div>
              <div><label className="block font-bold mb-1">رقم الهاتف</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
              <div>
                <label className="block font-bold mb-1">المحافظة</label>
                <select name="governorate" value={formData.governorate} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required>
                    {iraqiGovernorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                </select>
              </div>
               <div>
                  <label className="block font-bold mb-1">التخصص</label>
                  <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required list="specialties-list" placeholder="اختر أو اكتب تخصصاً" />
                  <datalist id="specialties-list">{specialties.map(spec => <option key={spec} value={spec} />)}</datalist>
                </div>
              <div><label className="block font-bold mb-1">سنوات الخبرة</label><input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
              <div><label className="block font-bold mb-1">سعر الكشفية (دينار عراقي)</label><input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1">صورة الملف الشخصي</label>
                <div className="flex items-center gap-4 mt-2">
                  <img src={formData.profilePicture} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover bg-surface" />
                  <input type="file" accept="image/*" id="profilePictureUpload" className="hidden" onChange={handleImageChange} />
                  <label htmlFor="profilePictureUpload" className="cursor-pointer bg-surface dark:bg-background text-text-primary font-semibold px-4 py-2 rounded-lg hover:bg-border">تغيير الصورة</label>
                </div>
              </div>
              <div className="md:col-span-2"><label className="block font-bold mb-1">عنوان العيادة (الوصف الدقيق)</label><input type="text" name="location" placeholder="مثال: المنصور، قرب تقاطع الرواد" value={formData.location} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
              <div className="md:col-span-2"><label className="block font-bold mb-1">الشهادات (افصل بينها بفاصلة)</label><input type="text" name="certifications" value={formData.certifications} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
              <div className="md:col-span-2"><label className="block font-bold mb-1">نبذة تعريفية</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"></textarea></div>
              <div className="md:col-span-2">
                  <label className="block font-bold mb-1">تحديد الموقع على الخريطة</label>
                  {/* FIX: Use defined LocationPickerMap component */}
                  <LocationPickerMap initialLocation={[formData.lat, formData.lng]} onLocationChange={handleLocationChange} />
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-8">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-surface dark:bg-background rounded-lg">إلغاء</button>
              <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg">{isEditMode ? 'حفظ التغييرات' : 'إضافة الطبيب'}</button>
            </div>
          </form>
        </div>
      </div>
    );
};

const HomePageManager: React.FC = () => {
    type HomeManagerTab = 'promoted' | 'dentists' | 'beauty' | 'labs';
    const [activeTab, setActiveTab] = useState<HomeManagerTab>('promoted');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [beautyCenters, setBeautyCenters] = useState<BeautyCenter[]>([]);
    const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        const [docRes, centerRes, labRes] = await Promise.all([
            api.fetchAllDoctors(),
            api.fetchAllBeautyCenters(),
            api.fetchAllLaboratories()
        ]);
        if (docRes.ok) setDoctors(await docRes.json());
        if (centerRes.ok) setBeautyCenters(await centerRes.json());
        if (labRes.ok) setLaboratories(await labRes.json());
        setIsLoading(false);
    };
    
    useEffect(() => { fetchData(); }, []);

    const togglePromotion = async (id: string, isPromoted: boolean) => {
        const response = await api.updateDoctorPromotion(id, isPromoted);
        if (response.ok) {
            setDoctors(doctors.map(doc => doc.id === id ? { ...doc, promoted: isPromoted } : doc));
        }
    };

    const toggleHomeVisibility = async (id: string, type: 'doctor' | 'beauty' | 'lab', show: boolean) => {
        let response;
        switch (type) {
            case 'doctor':
                response = await api.updateDoctorHomeVisibility(id, show);
                if (response.ok) setDoctors(doctors.map(doc => doc.id === id ? { ...doc, showOnHome: show } : doc));
                break;
            case 'beauty':
                response = await api.updateBeautyCenterHomeVisibility(id, show);
                if (response.ok) setBeautyCenters(beautyCenters.map(c => c.id === id ? { ...c, showOnHome: show } : c));
                break;
            case 'lab':
                response = await api.updateLaboratoryHomeVisibility(id, show);
                if (response.ok) setLaboratories(laboratories.map(l => l.id === id ? { ...l, showOnHome: show } : l));
                break;
        }
    };
    
    const dentists = doctors.filter(d => d.specialty === 'طب الأسنان');

    const renderContent = () => {
        if (isLoading) return <div className="text-center p-8">جاري التحميل...</div>;
        switch(activeTab) {
            case 'promoted':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{doctors.map(doctor => (<div key={doctor.id} className="p-5 bg-background dark:bg-surface rounded-lg shadow text-center transition-transform transform hover:scale-105"><img src={doctor.profilePicture} alt={doctor.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" /><h3 className="font-bold text-xl">{doctor.name}</h3><p className="text-text-secondary text-sm mb-4">{doctor.specialty}</p><div className="flex items-center justify-center space-x-2 rtl:space-x-reverse"><span>غير مروج</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={doctor.promoted} onChange={() => togglePromotion(doctor.id, !doctor.promoted)} className="sr-only peer" /><div className="w-11 h-6 bg-surface rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></label><span>مروج</span></div></div>))}</div>
                );
            case 'dentists':
                return <VisibilityControlList items={dentists} onToggle={(id, show) => toggleHomeVisibility(id, 'doctor', show)} title="أطباء الأسنان" />;
            case 'beauty':
                return <VisibilityControlList items={beautyCenters} onToggle={(id, show) => toggleHomeVisibility(id, 'beauty', show)} title="مراكز التجميل" />;
            case 'labs':
                return <VisibilityControlList items={laboratories} onToggle={(id, show) => toggleHomeVisibility(id, 'lab', show)} title="المختبرات" />;
            default: return null;
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">إدارة الصفحة الرئيسية</h1>
            <p className="text-text-secondary mb-8">التحكم في المحتوى الذي يظهر للمرضى في الصفحة الرئيسية.</p>
            <div className="mb-6 border-b border-border">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <TabButton name="الأطباء المتميزون" isActive={activeTab === 'promoted'} onClick={() => setActiveTab('promoted')} />
                    <TabButton name="أطباء الأسنان" isActive={activeTab === 'dentists'} onClick={() => setActiveTab('dentists')} />
                    <TabButton name="مراكز التجميل" isActive={activeTab === 'beauty'} onClick={() => setActiveTab('beauty')} />
                    <TabButton name="المختبرات" isActive={activeTab === 'labs'} onClick={() => setActiveTab('labs')} />
                </nav>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};

const TabButton: React.FC<{name: string, isActive: boolean, onClick: () => void}> = ({ name, isActive, onClick }) => (
    <button onClick={onClick} className={`${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>{name}</button>
);

const VisibilityControlList: React.FC<{ items: (Doctor | BeautyCenter | Laboratory)[], onToggle: (id: string, show: boolean) => void, title: string }> = ({ items, onToggle, title }) => (
    <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">{`إظهار ${title} في الرئيسية`}</h2>
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-surface dark:bg-background rounded-lg">
                    <div><p className="font-semibold">{item.name}</p><p className="text-sm text-text-secondary">{item.governorate}</p></div>
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <span>إخفاء</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!item.showOnHome} onChange={() => onToggle(item.id, !item.showOnHome)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <span>إظهار</span>
                    </div>
                </div>
            ))}
            {items.length === 0 && <p className="text-center text-text-secondary py-4">{`لا يوجد ${title} لعرضهم.`}</p>}
        </div>
    </div>
);


const ReviewsManager: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);

    useEffect(() => { 
        const fetchReviewsAndDocs = async () => {
            const [revRes, docRes] = await Promise.all([api.fetchAllReviews(), api.fetchAllDoctors()]);
            if (revRes.ok) setReviews(await revRes.json());
            if (docRes.ok) setAllDoctors(await docRes.json());
        };
        fetchReviewsAndDocs();
    }, []);
    
    const handleVisibilityChange = async (reviewId: string, isVisible: boolean) => {
        await api.updateReviewVisibility(reviewId, isVisible);
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, isVisible } : r));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">إدارة التقييمات</h1>
            <p className="text-text-secondary mb-8">مراجعة تقييمات المرضى والموافقة عليها أو إخفائها.</p>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="border-b border-border"><tr><th className="p-3">المريض</th><th className="p-3">الطبيب</th><th className="p-3">التقييم</th><th className="p-3">الحالة</th><th className="p-3">الإجراء</th></tr></thead>
                        <tbody>
                            {reviews.map(r => (
                                <tr key={r.id} className="border-b border-border hover:bg-surface dark:hover:bg-background">
                                    <td className="p-3 font-semibold">{r.patientName}</td>
                                    <td className="p-3">{allDoctors.find(d => d.id === r.doctorId)?.name}</td>
                                    <td className="p-3"><div className="flex">{[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400' : 'text-gray-400'}`}/>)}</div></td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.isVisible ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{r.isVisible ? 'ظاهر' : 'مخفي'}</span></td>
                                    <td className="p-3"><button onClick={() => handleVisibilityChange(r.id, !r.isVisible)} className="text-sm font-semibold text-primary hover:underline">{r.isVisible ? 'إخفاء' : 'إظهار'}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const SystemMonitor: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState({activeUsers: 0, pendingAppointments: 0, criticalAlerts: 0});
    useEffect(() => { 
        const fetchMonitoringData = async () => {
            const [logRes, statsRes] = await Promise.all([api.fetchActivityLog(), api.getSystemStats()]);
            if (logRes.ok) setLogs(await logRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
        };
        fetchMonitoringData();
    }, []);
    const getIcon = (type: ActivityLog['type']) => {
        switch (type) {
            case 'critical': return <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center"><BellIcon className="w-5 h-5 text-error" /></div>;
            case 'warning': return <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center"><ClockIcon className="w-5 h-5 text-accent" /></div>;
            default: return <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><UsersIcon className="w-5 h-5 text-primary" /></div>;
        }
    };
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">مراقبة نشاط النظام</h1><p className="text-text-secondary mb-8">عرض في الوقت الفعلي لنشاط النظام.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="إجمالي المستخدمين" value={stats.activeUsers.toLocaleString('ar-IQ')} />
                <StatCard title="المواعيد القادمة" value={stats.pendingAppointments.toLocaleString('ar-IQ')} />
                <StatCard title="تنبيهات حرجة (24 ساعة)" value={stats.criticalAlerts.toLocaleString('ar-IQ')} critical={stats.criticalAlerts > 0} />
            </div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">سجل النشاط الأخير</h2>
                <div className="space-y-4">{logs.map(log => (<div key={log.id} className="flex items-start space-x-4 rtl:space-x-reverse p-3 rounded-lg hover:bg-surface dark:hover:bg-background"><div className="flex-shrink-0">{getIcon(log.type)}</div><div className="flex-1"><p className={`font-semibold ${log.type === 'critical' ? 'text-error' : ''}`}>{log.message}</p>{log.details && <p className="text-sm text-text-secondary">{log.details}</p>}</div><p className="text-sm text-text-secondary">{new Date(log.timestamp).toLocaleTimeString('ar-IQ')}</p></div>))}</div>
            </div>
        </div>
    );
};

const GeneralSettingsView: React.FC<{
    currentSettings: AppSettings;
    onSave: (settings: Partial<AppSettings>) => void;
}> = ({ currentSettings, onSave }) => {
    const [settings, setSettings] = useState(currentSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('socialLinks.')) {
           const key = name.split('.')[1] as keyof AppSettings['socialLinks'];
           setSettings(prev => ({
               ...prev,
               socialLinks: {
                   ...prev.socialLinks,
                   [key]: value
               }
           }));
       } else {
        setSettings(prev => ({ ...prev, [name]: value }));
       }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setSettings(prev => ({ ...prev, appLogoUrl: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            onSave(settings);
            setIsSaving(false);
            alert("تم حفظ الإعدادات بنجاح!");
        }, 500);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">الإعدادات العامة</h1>
            <p className="text-text-secondary mb-8">إدارة هوية وتفاصيل البرنامج الأساسية.</p>
            <form onSubmit={handleSubmit} className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-2xl mx-auto space-y-6">
                <div>
                    <label htmlFor="appName" className="font-semibold block mb-2">اسم البرنامج (الكلية)</label>
                    <input id="appName" name="appName" type="text" value={settings.appName} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" />
                </div>
                <div>
                    <label className="font-semibold block mb-2">شعار البرنامج</label>
                    <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-xl bg-surface/50 dark:bg-background/50">
                        <div className="relative group">
                            {settings.appLogoUrl ? (
                                <img src={settings.appLogoUrl} alt="App Logo" className="w-32 h-32 rounded-full object-cover shadow-lg border-2 border-primary" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-border flex items-center justify-center text-xs text-text-secondary border-2 border-dashed border-gray-400">لا يوجد شعار</div>
                            )}
                            <label htmlFor="logo-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <PhotoIcon className="w-8 h-8" />
                            </label>
                        </div>
                        <div className="text-center">
                            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            <label htmlFor="logo-upload" className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                                <PlusCircleIcon className="w-4 h-4 ml-2" />
                                رفع شعار جديد
                            </label>
                            <p className="text-[10px] text-text-secondary mt-2">يفضل استخدام صورة مربعة (PNG أو JPG)</p>
                        </div>
                    </div>
                </div>
                 <div className="pt-6 border-t border-border">
                   <h3 className="text-xl font-bold mb-4">روابط التواصل الاجتماعي</h3>
                   <div className="space-y-4">
                       <div><label className="font-semibold block mb-1">فيسبوك</label><input name="socialLinks.facebook" type="text" value={settings.socialLinks?.facebook || ''} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" dir="ltr" /></div>
                       <div><label className="font-semibold block mb-1">انستغرام</label><input name="socialLinks.instagram" type="text" value={settings.socialLinks?.instagram || ''} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" dir="ltr" /></div>
                       <div><label className="font-semibold block mb-1">واتساب (الرابط الكامل)</label><input name="socialLinks.whatsapp" type="text" value={settings.socialLinks?.whatsapp || ''} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" placeholder="https://wa.me/..." dir="ltr" /></div>
                   </div>
               </div>
                <div className="pt-4 text-left">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white font-bold rounded-lg transition-transform transform hover:scale-105 disabled:bg-text-secondary">
                        {isSaving ? '... جاري الحفظ' : 'حفظ الإعدادات'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const StatCard: React.FC<{title: string; value: string; critical?: boolean}> = ({title, value, critical}) => (<div className={`p-6 bg-background dark:bg-surface rounded-lg shadow transition-transform transform hover:scale-105 ${critical ? 'border-2 border-error' : ''}`}><h3 className="text-text-secondary mb-2">{title}</h3><p className={`text-4xl font-bold ${critical ? 'text-error' : ''}`}>{value}</p></div>);

const BeautyCenterManager: React.FC = () => {
    const [centers, setCenters] = useState<BeautyCenter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ isOpen: boolean; center: BeautyCenter | null }>({ isOpen: false, center: null });

    const fetchCenters = async () => {
        setIsLoading(true);
        const response = await api.fetchAllBeautyCenters();
        if (response.ok) setCenters(await response.json());
        setIsLoading(false);
    };

    useEffect(() => { fetchCenters(); }, []);

    const handleSaveCenter = async (centerData: Partial<BeautyCenter>, centerId?: string) => {
        if (centerId) await api.updateBeautyCenterByAdmin(centerId, centerData);
        else await api.addBeautyCenterByAdmin(centerData as any);
        setModalState({ isOpen: false, center: null });
        fetchCenters();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">إدارة مراكز التجميل</h1><button onClick={() => setModalState({ isOpen: true, center: null })} className="bg-accent text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">إضافة مركز +</button></div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                 <table className="w-full text-right">
                    <thead className="border-b border-border"><tr><th className="p-3">الاسم</th><th className="p-3">المحافظة</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={4} className="text-center p-4">جاري التحميل...</td></tr>) :
                        centers.map(center => (<tr key={center.id} className="border-b border-border hover:bg-surface dark:hover:bg-background transition-colors">
                        <td className="p-3 font-semibold">{center.name}</td>
                        <td className="p-3 text-text-secondary">{center.governorate}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${center.status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{center.status === 'active' ? 'نشط' : 'معطل'}</span></td>
                        <td className="p-3"><button onClick={() => setModalState({ isOpen: true, center: center })} className="text-sm font-semibold text-primary hover:underline">تعديل</button></td>
                    </tr>))}</tbody>
                </table>
            </div>
            {modalState.isOpen && <BeautyCenterFormModal onSave={handleSaveCenter} onClose={() => setModalState({ isOpen: false, center: null })} initialCenter={modalState.center} />}
        </div>
    );
};

const BeautyCenterFormModal: React.FC<{
    onSave: (centerData: Partial<BeautyCenter>, centerId?: string) => void;
    onClose: () => void;
    initialCenter?: BeautyCenter | null;
}> = ({ onSave, onClose, initialCenter }) => {
    const isEditMode = !!initialCenter;
    const [formData, setFormData] = useState({
        name: initialCenter?.name || '',
        email: initialCenter?.email || '',
        password: '',
        governorate: initialCenter?.governorate || 'بغداد',
        location: initialCenter?.location || '',
        lat: initialCenter?.lat || 33.3152,
        lng: initialCenter?.lng || 44.3661,
        bio: initialCenter?.bio || '',
        phoneNumber: initialCenter?.phoneNumber || '',
        status: initialCenter?.status || 'active',
        profilePicture: initialCenter?.profilePicture || 'https://i.ibb.co/6gT3jJV/doctor-illustration.png'
    });
    const [services, setServices] = useState<Omit<BeautyService, 'id'>[]>(initialCenter?.services || []);
    const [newService, setNewService] = useState({ name: '', price: '', duration: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewService(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddService = () => {
        if (newService.name && newService.price && newService.duration) {
            setServices([...services, { name: newService.name, price: Number(newService.price), duration: Number(newService.duration) }]);
            setNewService({ name: '', price: '', duration: '' });
        }
    };

    const handleRemoveService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { password, ...rest } = formData;
        const dataToSave: Partial<BeautyCenter> = { 
            ...rest, 
            services: services.map(s => ({...s, id: Math.random().toString(36).substr(2, 9)})) 
        };
        if (password) dataToSave.password = password;
        onSave(dataToSave, initialCenter?.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 pt-8 flex justify-center items-start">
            <div className="bg-background dark:bg-surface p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'تعديل بيانات المركز' : 'إضافة مركز تجميل جديد'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div><label className="block font-bold mb-1">اسم المركز</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
                        <div><label className="block font-bold mb-1">البريد الإلكتروني</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
                        <div><label className="block font-bold mb-1">كلمة المرور</label><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" placeholder={isEditMode ? 'اتركه فارغاً لعدم التغيير' : 'كلمة المرور الأولية'} required={!isEditMode}/></div>
                        <div><label className="block font-bold mb-1">رقم الهاتف</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
                        <div>
                            <label className="block font-bold mb-1">المحافظة</label>
                            <select name="governorate" value={formData.governorate} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required>
                                {iraqiGovernorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                            </select>
                        </div>
                         <div className="md:col-span-2">
                          <label className="block font-bold mb-1">صورة الملف الشخصي</label>
                          <div className="flex items-center gap-4 mt-2">
                            <img src={formData.profilePicture} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover bg-surface" />
                            <input type="file" accept="image/*" id="profilePictureUpload" className="hidden" onChange={handleImageChange} />
                            <label htmlFor="profilePictureUpload" className="cursor-pointer bg-surface dark:bg-background text-text-primary font-semibold px-4 py-2 rounded-lg hover:bg-border">تغيير الصورة</label>
                          </div>
                        </div>
                        <div className="md:col-span-2"><label className="block font-bold mb-1">العنوان (الوصف الدقيق)</label><input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
                        <div className="md:col-span-2"><label className="block font-bold mb-1">نبذة تعريفية</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"></textarea></div>
                        <div className="md:col-span-2">
                          <label className="block font-bold mb-1">تحديد الموقع على الخريطة</label>
                          {/* FIX: Use defined LocationPickerMap component */}
                          <LocationPickerMap initialLocation={[formData.lat, formData.lng]} onLocationChange={handleLocationChange} />
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="text-xl font-bold mb-4">خدمات المركز</h3>
                        {services.map((service, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-surface dark:bg-background rounded">
                                <span className="flex-1">{service.name}</span>
                                <span className="flex-1">{service.price.toLocaleString('ar-IQ')} د.ع</span>
                                <span className="flex-1">{service.duration} دقيقة</span>
                                <button type="button" onClick={() => handleRemoveService(index)} className="text-error"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <div className="flex items-end gap-2 mt-4">
                            <input name="name" value={newService.name} onChange={handleServiceChange} placeholder="اسم الخدمة" className="w-full p-2 bg-surface dark:bg-background border border-border rounded" />
                            <input name="price" type="number" value={newService.price} onChange={handleServiceChange} placeholder="السعر" className="w-1/3 p-2 bg-surface dark:bg-background border border-border rounded" />
                            <input name="duration" type="number" value={newService.duration} onChange={handleServiceChange} placeholder="المدة (دقائق)" className="w-1/3 p-2 bg-surface dark:bg-background border border-border rounded" />
                            <button type="button" onClick={handleAddService} className="p-2 bg-success/20 text-success rounded-full"><PlusCircleIcon className="w-6 h-6"/></button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-surface dark:bg-background rounded-lg">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-accent text-white font-bold rounded-lg">{isEditMode ? 'حفظ التغييرات' : 'إضافة المركز'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LaboratoryManager: React.FC = () => {
    const [labs, setLabs] = useState<Laboratory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ isOpen: boolean; lab: Laboratory | null }>({ isOpen: false, lab: null });

    const fetchLabs = async () => {
        setIsLoading(true);
        const response = await api.fetchAllLaboratories();
        if (response.ok) setLabs(await response.json());
        setIsLoading(false);
    };

    useEffect(() => { fetchLabs(); }, []);

    const handleSaveLab = async (labData: Partial<Laboratory>, labId?: string) => {
        if (labId) await api.updateLaboratoryByAdmin(labId, labData);
        else await api.addLaboratoryByAdmin(labData as any);
        setModalState({ isOpen: false, lab: null });
        fetchLabs();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">إدارة المختبرات</h1><button onClick={() => setModalState({ isOpen: true, lab: null })} className="bg-primary text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">إضافة مختبر +</button></div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                 <table className="w-full text-right">
                    <thead className="border-b border-border"><tr><th className="p-3">الاسم</th><th className="p-3">المحافظة</th><th className="p-3">الحالة</th><th className="p-3">الإجراءات</th></tr></thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={4} className="text-center p-4">جاري التحميل...</td></tr>) :
                        labs.map(lab => (<tr key={lab.id} className="border-b border-border hover:bg-surface dark:hover:bg-background transition-colors">
                        <td className="p-3 font-semibold">{lab.name}</td>
                        <td className="p-3 text-text-secondary">{lab.governorate}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${lab.status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{lab.status === 'active' ? 'نشط' : 'معطل'}</span></td>
                        <td className="p-3"><button onClick={() => setModalState({ isOpen: true, lab: lab })} className="text-sm font-semibold text-primary hover:underline">تعديل</button></td>
                    </tr>))}</tbody>
                </table>
            </div>
            {modalState.isOpen && <LaboratoryFormModal onSave={handleSaveLab} onClose={() => setModalState({ isOpen: false, lab: null })} initialLab={modalState.lab} />}
        </div>
    );
};

const LaboratoryFormModal: React.FC<{
    onSave: (labData: Partial<Laboratory>, labId?: string) => void;
    onClose: () => void;
    initialLab?: Laboratory | null;
}> = ({ onSave, onClose, initialLab }) => {
    const isEditMode = !!initialLab;
    const [formData, setFormData] = useState({
        name: initialLab?.name || '',
        email: initialLab?.email || '',
        password: '',
        governorate: initialLab?.governorate || 'بغداد',
        location: initialLab?.location || '',
        lat: initialLab?.lat || 33.3152,
        lng: initialLab?.lng || 44.3661,
        bio: initialLab?.bio || '',
        phoneNumber: initialLab?.phoneNumber || '',
        status: initialLab?.status || 'active',
        profilePicture: initialLab?.profilePicture || 'https://i.ibb.co/6gT3jJV/doctor-illustration.png'
    });
    const [tests, setTests] = useState<Omit<LabTest, 'id'>[]>(initialLab?.tests || []);
    const [newTest, setNewTest] = useState({ name: '', price: '', duration: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleTestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTest(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddTest = () => {
        if (newTest.name && newTest.price && newTest.duration) {
            setTests([...tests, { name: newTest.name, price: Number(newTest.price), duration: Number(newTest.duration) }]);
            setNewTest({ name: '', price: '', duration: '' });
        }
    };

    const handleRemoveTest = (index: number) => {
        setTests(tests.filter((_, i) => i !== index));
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { password, ...rest } = formData;
        const dataToSave: Partial<Laboratory> = { 
            ...rest, 
            tests: tests.map(t => ({...t, id: Math.random().toString(36).substr(2, 9)})) 
        };
        if (password) dataToSave.password = password;
        onSave(dataToSave, initialLab?.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 pt-8 flex justify-center items-start">
            <div className="bg-background dark:bg-surface p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'تعديل بيانات المختبر' : 'إضافة مختبر جديد'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div><label className="block font-bold mb-1">اسم المختبر</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
                        <div><label className="block font-bold mb-1">البريد الإلكتروني</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required/></div>
                        <div><label className="block font-bold mb-1">كلمة المرور</label><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" placeholder={isEditMode ? 'اتركه فارغاً لعدم التغيير' : 'كلمة المرور الأولية'} required={!isEditMode}/></div>
                        <div><label className="block font-bold mb-1">رقم الهاتف</label><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
                        <div><label className="block font-bold mb-1">المحافظة</label><select name="governorate" value={formData.governorate} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" required>{iraqiGovernorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}</select></div>
                         <div className="md:col-span-2">
                          <label className="block font-bold mb-1">صورة الملف الشخصي</label>
                          <div className="flex items-center gap-4 mt-2">
                            <img src={formData.profilePicture} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover bg-surface" />
                            <input type="file" accept="image/*" id="labProfileUpload" className="hidden" onChange={handleImageChange} />
                            <label htmlFor="labProfileUpload" className="cursor-pointer bg-surface dark:bg-background text-text-primary font-semibold px-4 py-2 rounded-lg hover:bg-border">تغيير الصورة</label>
                          </div>
                        </div>
                        <div className="md:col-span-2"><label className="block font-bold mb-1">العنوان (الوصف الدقيق)</label><input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
                        <div className="md:col-span-2"><label className="block font-bold mb-1">نبذة تعريفية</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"></textarea></div>
                        <div className="md:col-span-2">
                          <label className="block font-bold mb-1">تحديد الموقع على الخريطة</label>
                          {/* FIX: Use defined LocationPickerMap component */}
                          <LocationPickerMap initialLocation={[formData.lat, formData.lng]} onLocationChange={handleLocationChange} />
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="text-xl font-bold mb-4">الفحوصات المتوفرة</h3>
                        {tests.map((test, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-surface dark:bg-background rounded">
                                <span className="flex-1">{test.name}</span>
                                <span className="flex-1">{test.price.toLocaleString('ar-IQ')} د.ع</span>
                                <span className="flex-1">{test.duration} دقيقة</span>
                                <button type="button" onClick={() => handleRemoveTest(index)} className="text-error"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <div className="flex items-end gap-2 mt-4">
                            <input name="name" value={newTest.name} onChange={handleTestChange} placeholder="اسم الفحص" className="w-full p-2 bg-surface dark:bg-background border border-border rounded" />
                            <input name="price" type="number" value={newTest.price} onChange={handleTestChange} placeholder="السعر" className="w-1/3 p-2 bg-surface dark:bg-background border border-border rounded" />
                            <input name="duration" type="number" value={newTest.duration} onChange={handleTestChange} placeholder="المدة (دقائق)" className="w-1/3 p-2 bg-surface dark:bg-background border border-border rounded" />
                            <button type="button" onClick={handleAddTest} className="p-2 bg-success/20 text-success rounded-full"><PlusCircleIcon className="w-6 h-6"/></button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-8">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-surface dark:bg-background rounded-lg">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg">{isEditMode ? 'حفظ التغييرات' : 'إضافة المختبر'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
