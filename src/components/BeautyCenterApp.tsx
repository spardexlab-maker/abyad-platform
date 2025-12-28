

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { BeautyCenter, BeautyBooking, DoctorSchedule, Notification, BeautyService, ReportData, PatientBooking, GalleryImage, OfferPackage, Doctor, Laboratory } from '../types';
import { HomeIcon, UsersIcon, CalendarIcon, ClockIcon, Cog6ToothIcon, LogoutIcon, SunIcon, MoonIcon, MenuIcon, SparklesIcon, PlusCircleIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ChartPieIcon, PhotoIcon, TagIcon } from './Icons';
import type { Theme } from '../App';
import * as api from '../services/apiService';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

// Declare Chart.js for TypeScript
declare var Chart: any;

// Let TypeScript know about the Leaflet global object
declare var L: any;

const formatTime = (date: Date) => date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatDateToYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];
const generateId = () => Math.random().toString(36).substr(2, 9);

type BeautyCenterView = 'dashboard' | 'profileSetup' | 'services' | 'scheduleSettings' | 'bookings' | 'reports' | 'gallery' | 'offers';

export const BeautyCenterApp: React.FC<{ center: BeautyCenter; appName: string; }> = ({ center, appName }) => {
    const { logout } = useAuthStore();
    const { theme, toggleTheme } = useUiStore();
    const [currentView, setCurrentView] = useState<BeautyCenterView>('dashboard');
    const [currentCenter, setCurrentCenter] = useState<BeautyCenter>(center);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const onBookingChange = (changedBooking: BeautyBooking) => {
        const existing = currentCenter.bookings.find(b => b.id === changedBooking.id);
        let updatedBookings;
        if (existing) {
             updatedBookings = currentCenter.bookings.map(b => b.id === changedBooking.id ? changedBooking : b);
        } else {
            updatedBookings = [...currentCenter.bookings, changedBooking];
        }
        setCurrentCenter(prev => ({ ...prev, bookings: updatedBookings }));
    };

    const handleProfileUpdate = async (profileData: Partial<BeautyCenter>) => {
        setIsSaving(true);
        const response = await api.updateBeautyCenterProfile(currentCenter.id, profileData);
        if(response.ok) {
            setCurrentCenter(await response.json());
            alert("تم تحديث الملف الشخصي للمركز بنجاح!");
        } else {
            alert("فشل تحديث الملف الشخصي.");
        }
        setIsSaving(false);
    };

    const handleScheduleUpdate = async (newSchedule: DoctorSchedule) => {
        setIsSaving(true);
        const response = await api.updateBeautyCenterSchedule(currentCenter.id, newSchedule);
        if(response.ok) {
            setCurrentCenter(await response.json());
            alert("تم تحديث جدول المركز بنجاح!");
        } else {
            alert("فشل تحديث الجدول.");
        }
        setIsSaving(false);
    };

    const handleServicesUpdate = async (services: BeautyService[]) => {
        setIsSaving(true);
        const response = await api.updateBeautyCenterServices(currentCenter.id, services);
        if(response.ok) {
            setCurrentCenter(await response.json());
            alert("تم تحديث الخدمات بنجاح!");
        } else {
            alert("فشل تحديث الخدمات.");
        }
        setIsSaving(false);
    }

    const handleGalleryUpdate = async (gallery: GalleryImage[]) => {
        setIsSaving(true);
        const response = await api.updateBeautyCenterGallery(currentCenter.id, gallery);
        if(response.ok) {
            setCurrentCenter(await response.json());
            alert("تم تحديث معرض الصور بنجاح!");
        } else {
            alert("فشل تحديث المعرض.");
        }
        setIsSaving(false);
    };

    const handleOffersUpdate = async (offers: OfferPackage[]) => {
        setIsSaving(true);
        const response = await api.updateBeautyCenterOffers(currentCenter.id, offers);
        if(response.ok) {
            setCurrentCenter(await response.json());
            alert("تم تحديث العروض والباقات بنجاح!");
        } else {
            alert("فشل تحديث العروض.");
        }
        setIsSaving(false);
    };


    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView center={currentCenter} />;
            case 'profileSetup':
                return <ProfileSetupView center={currentCenter} onSave={handleProfileUpdate} isSaving={isSaving} />;
            case 'services':
                return <ServicesManager center={currentCenter} onSave={handleServicesUpdate} isSaving={isSaving} />;
            case 'scheduleSettings':
                return <ScheduleSettingsView schedule={currentCenter.schedule} onSave={handleScheduleUpdate} isSaving={isSaving} />;
            case 'bookings':
                return <BookingsManager center={currentCenter} onBookingChange={onBookingChange} />;
            case 'reports':
                return <ReportsView entityId={currentCenter.id} entityType="beauty_center" />;
            case 'gallery':
                return <GalleryManager entity={currentCenter} onSave={handleGalleryUpdate} isSaving={isSaving} />;
            case 'offers':
                return <OffersManager center={currentCenter} onSave={handleOffersUpdate} isSaving={isSaving} />;
            default:
                return <DashboardView center={currentCenter} />;
        }
    };
    
    const handleNavItemClick = (view: BeautyCenterView) => {
        setCurrentView(view);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-surface dark:bg-background text-text-primary dark:text-text-primary transition-colors duration-300">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`w-64 flex-shrink-0 bg-background dark:bg-surface border-l dark:border-border flex flex-col fixed md:relative inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                <div className="h-16 flex items-center justify-center border-b border-border px-4"><h1 className="text-2xl font-bold text-accent truncate">{appName}</h1></div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={HomeIcon} label="لوحة التحكم" active={currentView === 'dashboard'} onClick={() => handleNavItemClick('dashboard')} />
                    <NavItem icon={UsersIcon} label="ملف المركز" active={currentView === 'profileSetup'} onClick={() => handleNavItemClick('profileSetup')} />
                    <NavItem icon={SparklesIcon} label="إدارة الخدمات" active={currentView === 'services'} onClick={() => handleNavItemClick('services')} />
                    <NavItem icon={PhotoIcon} label="معرض الصور" active={currentView === 'gallery'} onClick={() => handleNavItemClick('gallery')} />
                    <NavItem icon={TagIcon} label="العروض والباقات" active={currentView === 'offers'} onClick={() => handleNavItemClick('offers')} />
                    <NavItem icon={CalendarIcon} label="إعداد الجدول" active={currentView === 'scheduleSettings'} onClick={() => handleNavItemClick('scheduleSettings')} />
                    <NavItem icon={ClockIcon} label="إدارة الحجوزات" active={currentView === 'bookings'} onClick={() => handleNavItemClick('bookings')} />
                    <NavItem icon={ChartPieIcon} label="التقارير" active={currentView === 'reports'} onClick={() => handleNavItemClick('reports')} />
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

const NavItem: React.FC<{ icon: React.ElementType, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (<a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-4 py-2 rounded-lg transition-colors ${active ? 'bg-accent/10 text-accent' : 'hover:bg-surface dark:hover:bg-background'}`}><Icon className="w-5 h-5 ml-3" />{label}</a>);

const StatCard: React.FC<{title: string; value: string;}> = ({title, value}) => (<div className="p-6 bg-background dark:bg-surface rounded-lg shadow transition-transform transform hover:scale-105"><h3 className="text-text-secondary mb-2">{title}</h3><p className="text-4xl font-bold">{value}</p></div>);

const DashboardView: React.FC<{ center: BeautyCenter }> = ({ center }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todaysBookings = center.bookings.filter(b => new Date(b.startTime).toISOString().split('T')[0] === todayStr && b.status === 'scheduled');
    const completedThisMonth = center.bookings.filter(b => b.status === 'completed' && new Date(b.startTime).getMonth() === today.getMonth());
    const estimatedIncome = completedThisMonth.reduce((sum, b) => sum + b.servicePrice, 0).toLocaleString('ar-IQ');

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً، {center.name}</h1>
            <p className="text-text-secondary mb-8">إليك ملخص نشاطك اليوم.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="حجوزات اليوم" value={todaysBookings.length.toString()} />
                <StatCard title="الدخل الشهري المتوقع" value={`${estimatedIncome} دينار عراقي`} />
            </div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">حجوزات اليوم</h2>
                {todaysBookings.length > 0 ? (
                    <div className="space-y-3">
                        {todaysBookings.map(booking => (
                            <div key={booking.id} className="flex justify-between items-center p-3 bg-surface dark:bg-background rounded-lg">
                                <div>
                                    <span className="font-semibold">{booking.patientName}</span>
                                    <p className="text-sm text-text-secondary">{booking.serviceName}</p>
                                </div>
                                <span className="text-accent font-bold">{formatTime(new Date(booking.startTime))}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-text-secondary text-center py-4">لا توجد حجوزات مجدولة لهذا اليوم.</p>
                )}
            </div>
        </div>
    );
};

const ProfileSetupView: React.FC<{ center: BeautyCenter; onSave: (data: Partial<BeautyCenter>) => void; isSaving: boolean }> = ({ center, onSave, isSaving }) => {
    const [formData, setFormData] = useState({
        name: center.name,
        location: center.location,
        bio: center.bio,
        phoneNumber: center.phoneNumber || '',
        lat: center.lat,
        lng: center.lng,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    };
    
    const handleLocationChange = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إعداد ملف المركز</h1>
            <form onSubmit={handleSubmit} className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-2xl mx-auto space-y-4">
                <div><label className="font-semibold">اسم المركز</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div><label className="font-semibold">العنوان</label><input name="location" type="text" value={formData.location} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div>
                  <label className="font-semibold">تحديد الموقع على الخريطة</label>
                  <LocationPickerMap initialLocation={[formData.lat, formData.lng]} onLocationChange={handleLocationChange}/>
                </div>
                <div><label className="font-semibold">رقم الهاتف</label><input name="phoneNumber" type="text" value={formData.phoneNumber} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div><label className="font-semibold">نبذة تعريفية</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded"></textarea></div>
                <div className="pt-4"><button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-white font-bold rounded-lg disabled:bg-text-secondary">{isSaving ? '...' : 'حفظ التغييرات'}</button></div>
            </form>
        </div>
    );
};

const LocationPickerMap: React.FC<{
    initialLocation: [number, number];
    onLocationChange: (lat: number, lng: number) => void;
}> = ({ initialLocation, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let map: any;
        if (mapContainerRef.current) {
            map = L.map(mapContainerRef.current).setView(initialLocation, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            const marker = L.marker(initialLocation, { draggable: true }).addTo(map);
            marker.on('dragend', (e: any) => onLocationChange(e.target.getLatLng().lat, e.target.getLatLng().lng));
            map.on('click', (e: any) => {
                marker.setLatLng(e.latlng);
                onLocationChange(e.latlng.lat, e.latlng.lng);
            });
        }
        return () => { if(map) map.remove(); };
    }, [initialLocation, onLocationChange]);

    return <div ref={mapContainerRef} className="h-64 w-full rounded-lg" />;
};

const ServicesManager: React.FC<{ center: BeautyCenter; onSave: (services: BeautyService[]) => void; isSaving: boolean }> = ({ center, onSave, isSaving }) => {
    const [services, setServices] = useState<BeautyService[]>(() => JSON.parse(JSON.stringify(center.services)));
    const [newService, setNewService] = useState({ name: '', price: '', duration: '' });

    const handleNewServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewService(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const handleAddService = () => {
        if (newService.name && newService.price && newService.duration) {
            setServices([...services, { id: generateId(), name: newService.name, price: Number(newService.price), duration: Number(newService.duration) }]);
            setNewService({ name: '', price: '', duration: '' });
        }
    };

    const handleRemoveService = (id: string) => setServices(services.filter(s => s.id !== id));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(services); };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إدارة الخدمات</h1>
            <form onSubmit={handleSubmit} className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-3xl mx-auto space-y-4">
                <div className="space-y-3">
                    {services.map(service => (
                        <div key={service.id} className="flex items-center gap-2 p-2 bg-surface dark:bg-background rounded">
                            <span className="flex-1 font-semibold">{service.name}</span>
                            <span className="w-32 text-center">{service.price.toLocaleString('ar-IQ')} د.ع</span>
                            <span className="w-24 text-center">{service.duration} دقيقة</span>
                            <button type="button" onClick={() => handleRemoveService(service.id)} className="text-error"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                </div>
                <div className="pt-4 mt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-2">إضافة خدمة جديدة</h3>
                    <div className="flex items-end gap-2">
                        <input name="name" value={newService.name} onChange={handleNewServiceChange} placeholder="اسم الخدمة" className="w-full p-2 bg-surface dark:bg-background border border-border rounded" />
                        <input name="price" type="number" value={newService.price} onChange={handleNewServiceChange} placeholder="السعر" className="w-1/3 p-2 bg-surface dark:bg-background border border-border rounded" />
                        <input name="duration" type="number" value={newService.duration} onChange={handleNewServiceChange} placeholder="المدة (دقائق)" className="w-1/3 p-2 bg-surface dark:bg-background border border-border rounded" />
                        <button type="button" onClick={handleAddService} className="p-2 bg-success/20 text-success rounded-full h-10 w-10 flex-shrink-0"><PlusCircleIcon className="w-6 h-6"/></button>
                    </div>
                </div>
                <div className="pt-4 mt-4 border-t border-border"><button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-white font-bold rounded-lg">{isSaving ? '...' : 'حفظ الخدمات'}</button></div>
            </form>
        </div>
    );
};

const ScheduleSettingsView: React.FC<{ schedule: DoctorSchedule; onSave: (newSchedule: DoctorSchedule) => void; isSaving: boolean }> = ({ schedule, onSave, isSaving }) => {
    const [currentSchedule, setCurrentSchedule] = useState(schedule);
    const [daysOff, setDaysOff] = useState<string[]>(schedule.daysOff || []); 
    const [dayOffInput, setDayOffInput] = useState(''); 
    const daysOfWeek = [{id: 0, name: 'الأحد'}, {id: 1, name: 'الاثنين'}, {id: 2, name: 'الثلاثاء'}, {id: 3, name: 'الأربعاء'}, {id: 4, name: 'الخميس'}, {id: 5, name: 'الجمعة'}, {id: 6, 'name': 'السبت'}];
    
    const handleDayToggle = (dayId: number) => { 
        const newWorkDays = new Set(currentSchedule.workDays); 
        newWorkDays.has(dayId) ? newWorkDays.delete(dayId) : newWorkDays.add(dayId); 
        setCurrentSchedule(prev => ({ ...prev, workDays: Array.from(newWorkDays) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentSchedule(prev => ({...prev, [e.target.name]: e.target.valueAsNumber || e.target.value }));
    };

    const handleAddDayOff = () => { if (dayOffInput && !daysOff.includes(dayOffInput)) { setDaysOff([...daysOff, dayOffInput].sort()); setDayOffInput(''); } };
    const handleRemoveDayOff = (dateToRemove: string) => { setDaysOff(daysOff.filter(date => date !== dateToRemove)); };
    
    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        onSave({ ...currentSchedule, daysOff }); 
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إعدادات الجدول</h1>
            <form onSubmit={handleSubmit} className="p-6 bg-background dark:bg-surface rounded-lg shadow space-y-8">
                <div><h2 className="text-xl font-semibold mb-4">أيام العمل</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{daysOfWeek.map(day => (<label key={day.id} className="flex items-center"><input type="checkbox" checked={currentSchedule.workDays.includes(day.id)} onChange={() => handleDayToggle(day.id)} className="h-5 w-5 rounded text-accent focus:ring-accent mr-2" /><span>{day.name}</span></label>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block font-semibold mb-1">وقت بدء العمل</label><input type="time" name="startTime" value={currentSchedule.startTime} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background rounded"/></div>
                    <div><label className="block font-semibold mb-1">وقت انتهاء العمل</label><input type="time" name="endTime" value={currentSchedule.endTime} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background rounded"/></div>
                </div>
                <div className="mt-8"><button type="submit" disabled={isSaving} className="px-8 py-2 bg-accent text-white font-bold rounded-lg">{isSaving ? '...' : 'حفظ'}</button></div>
            </form>
        </div>
    );
};

const BookingsManager: React.FC<{ center: BeautyCenter, onBookingChange: (booking: BeautyBooking) => void }> = ({ center, onBookingChange }) => {
    const [modalState, setModalState] = useState<{ type: 'new' | 'details'; data: BeautyBooking | Date | null; isOpen: boolean }>({ type: 'new', data: null, isOpen: false });
    const [viewMode, setViewMode] = useState<'agenda' | 'calendar'>('agenda');

    const handleSlotClick = (date: Date) => setModalState({ type: 'new', data: date, isOpen: true });
    const handleBookingClick = (booking: BeautyBooking) => setModalState({ type: 'details', data: booking, isOpen: true });
    const handleModalClose = () => setModalState({ isOpen: false, type: 'new', data: null });
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">إدارة الحجوزات</h2>
                <div className="p-1 bg-surface dark:bg-background rounded-lg flex items-center">
                    <button onClick={() => setViewMode('agenda')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'agenda' ? 'bg-background dark:bg-surface shadow' : 'text-text-secondary'}`}>
                        قائمة اليوم
                    </button>
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-background dark:bg-surface shadow' : 'text-text-secondary'}`}>
                        التقويم الشهري
                    </button>
                </div>
            </div>

            {viewMode === 'agenda' ? (
                <DailyAgendaView 
                    bookings={center.bookings}
                    onBookingClick={handleBookingClick}
                    onAddNewClick={handleSlotClick}
                />
            ) : (
                <div className="p-6 bg-background dark:bg-surface rounded-lg shadow"><MonthlyCalendarView center={center} onSlotClick={handleSlotClick} onBookingClick={handleBookingClick} /></div>
            )}
            
            {modalState.isOpen && modalState.type === 'new' && <BeautyBookingModal centerId={center.id} services={center.services} onClose={handleModalClose} onBookingBooked={onBookingChange} initialDateTime={modalState.data as Date | null} />}
            {modalState.isOpen && modalState.type === 'details' && <BookingDetailsModal booking={modalState.data as BeautyBooking} onClose={handleModalClose} onBookingChange={onBookingChange} />}
        </div>
    );
};

const DailyAgendaView: React.FC<{
    bookings: BeautyBooking[];
    onBookingClick: (booking: BeautyBooking) => void;
    onAddNewClick: (date: Date) => void;
}> = ({ bookings, onBookingClick, onAddNewClick }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateChange = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + offset);
        setSelectedDate(newDate);
    };

    const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(e.target.value);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        setSelectedDate(new Date(date.getTime() + userTimezoneOffset));
    };

    const todaysBookings = useMemo(() => {
        return bookings
            .filter(b => new Date(b.startTime).toDateString() === selectedDate.toDateString())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [bookings, selectedDate]);
    
    const statusStyles = {
        scheduled: { border: 'border-accent', bg: 'bg-accent/10' },
        completed: { border: 'border-success', bg: 'bg-success/10' },
        canceled: { border: 'border-error', bg: 'bg-error/10' },
    };

    return (
        <div className="bg-background dark:bg-surface rounded-lg shadow-lg">
            <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                     <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-surface dark:hover:bg-background"><ChevronRightIcon className="w-5 h-5" /></button>
                     <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-surface dark:hover:bg-background">اليو</button>
                    <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-surface dark:hover:bg-background"><ChevronLeftIcon className="w-5 h-5" /></button>
                </div>
                <h3 className="font-bold text-lg order-first md:order-none">{selectedDate.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <input 
                    type="date" 
                    value={formatDateToYyyyMmDd(selectedDate)} 
                    onChange={handleDateSelect}
                    className="p-2 bg-surface dark:bg-background border border-border rounded-lg text-sm"
                />
            </div>
            <div className="p-4 min-h-[400px]">
                {todaysBookings.length > 0 ? (
                    <div className="space-y-3">
                        {todaysBookings.map(booking => (
                            <div key={booking.id} onClick={() => onBookingClick(booking)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-r-4 ${statusStyles[booking.status].border} ${statusStyles[booking.status].bg} hover:shadow-md hover:scale-[1.02]`}>
                                <div className="flex-1">
                                    <p className="font-bold">{booking.patientName}</p>
                                    <p className="text-sm text-text-secondary">{booking.serviceName}</p>
                                    <p className="text-sm text-text-secondary">{formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}</p>
                                </div>
                                <span className="text-xs font-semibold uppercase">{booking.status === 'scheduled' ? 'مجَدول' : booking.status === 'completed' ? 'مكتمل' : 'ملغي'}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-text-secondary">لا توجد حجوزات في هذا اليوم.</p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-border text-center">
                 <button onClick={() => onAddNewClick(selectedDate)} className="bg-accent text-white font-bold py-2 px-5 rounded-lg transition-transform transform hover:scale-105">إضافة حجز +</button>
            </div>
        </div>
    );
};

const MonthlyCalendarView: React.FC<{ center: BeautyCenter; onSlotClick: (date: Date) => void; onBookingClick: (booking: BeautyBooking) => void }> = ({ center, onSlotClick, onBookingClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date()); const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); const daysInMonth = endOfMonth.getDate(); const startDayOfWeek = startOfMonth.getDay(); const days = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]; const bookingsByDay: { [key: number]: BeautyBooking[] } = {}; center.bookings.forEach(booking => { const startTime = new Date(booking.startTime); if (startTime.getMonth() === currentDate.getMonth() && startTime.getFullYear() === currentDate.getFullYear()) { const day = startTime.getDate(); if (!bookingsByDay[day]) { bookingsByDay[day] = []; } bookingsByDay[day].push(booking); }});
    const renderDay = (day: number) => {
        const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isDayOff = center.schedule.daysOff?.includes(formatDateToYyyyMmDd(fullDate));
        const isWorkDay = center.schedule.workDays.includes(fullDate.getDay()) && !isDayOff;
        const dayBookings = bookingsByDay[day] || [];
        
        const dayCellClasses = `p-1 min-h-[100px] ${!isWorkDay ? 'bg-surface/50 dark:bg-background/50' : 'cursor-pointer hover:bg-surface dark:hover:bg-background'}`;

        return (
            <div className={dayCellClasses} onClick={() => isWorkDay && onSlotClick(fullDate)}>
                <div className={`text-center font-bold ${!isWorkDay ? 'text-text-secondary' : ''}`}>{day}</div>
                {isWorkDay ? (
                    <div className="mt-1 space-y-1 text-xs">
                        {dayBookings.length > 0 ? dayBookings.map(booking => (
                            <button key={booking.id} onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }} className={`w-full p-1 rounded text-center truncate transition-transform transform hover:scale-105 ${booking.status === 'scheduled' ? 'bg-accent/20 text-accent' : 'bg-surface text-text-secondary line-through'}`}>
                                {booking.patientName}
                            </button>
                        )) : <div className="text-center text-xs text-text-secondary pt-4">فارغ</div>}
                    </div>
                ) : isDayOff ? <div className="text-center text-xs text-error pt-4">عطلة</div> : null}
            </div>
        );
    };
    return (<div><div className="flex justify-between items-center mb-4"><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>&lt;</button><h3 className="font-bold text-lg">{currentDate.toLocaleString('ar-IQ', { month: 'long', year: 'numeric' })}</h3><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>&gt;</button></div><div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-text-secondary mb-2">{days.map(d => <div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 border-t border-r border-border">{Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} className="border-b border-l border-border"></div>)}{Array.from({ length: daysInMonth }).map((_, i) => (<div key={i+1} className="border-b border-l border-border">{renderDay(i + 1)}</div>))}</div></div>);
};

const BeautyBookingModal: React.FC<{ centerId: string; services: BeautyService[]; onClose: () => void; onBookingBooked: (booking: BeautyBooking) => void; initialDateTime: Date | null; }> = ({ centerId, services, onClose, onBookingBooked, initialDateTime }) => {
    const [patientName, setPatientName] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
    const [isSaving, setIsSaving] = useState(false);
    const [appointmentTime, setAppointmentTime] = useState(() => {
        const d = initialDateTime || new Date();
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d.toISOString().slice(0, 16);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedService = services.find(s => s.id === selectedServiceId);
        if (!selectedService) {
            alert('الرجاء اختيار خدمة.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await api.addBeautyBookingByCenter({
                centerId,
                patientName,
                startTime: new Date(appointmentTime),
                service: selectedService,
            });
            if (!response.ok) throw new Error("Failed to book");
            const newBooking = await response.json();
            onBookingBooked(newBooking);
            onClose();
        } catch (error) {
            alert('فشل في إضافة الحجز.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background dark:bg-surface p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">إضافة حجز جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-semibold block mb-2">اسم المريض</label>
                        <input
                            type="text"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            className="w-full p-2 bg-surface dark:bg-background border border-border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="font-semibold block mb-2">الخدمة</label>
                        <select 
                            value={selectedServiceId}
                            onChange={e => setSelectedServiceId(e.target.value)}
                            className="w-full p-2 bg-surface dark:bg-background border border-border rounded"
                            required
                        >
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.price.toLocaleString('ar-IQ')} د.ع</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-semibold block mb-2">وقت الحجز</label>
                        <input
                            type="datetime-local"
                            value={appointmentTime}
                            onChange={e => setAppointmentTime(e.target.value)}
                            className="w-full p-2 bg-surface dark:bg-background border border-border rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-surface dark:bg-background rounded-lg">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-6 py-2 bg-accent text-white font-bold rounded-lg disabled:bg-text-secondary">{isSaving ? '...' : 'حفظ الحجز'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BookingDetailsModal: React.FC<{ booking: BeautyBooking; onClose: () => void; onBookingChange: (booking: BeautyBooking) => void }> = ({ booking, onClose, onBookingChange }) => {
    const [notes, setNotes] = useState(booking.centerNotes || '');

    const handleSave = async () => {
        const response = await api.updateBookingNotes(booking.id, notes);
        if (response.ok) {
            onBookingChange(await response.json());
            alert("تم حفظ الملاحظات.");
            onClose();
        } else {
            alert("فشل حفظ الملاحظات.");
        }
    };
    
    const handleCancel = async () => {
        if (window.confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) {
            const response = await api.cancelBooking(booking.id, 'center');
            if(response.ok) {
                onBookingChange(await response.json());
                onClose();
            } else {
                alert("فشل إلغاء الحجز.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background dark:bg-surface p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">تفاصيل الحجز</h2>
                <div className="space-y-3 mb-4">
                    <p><strong>المريض:</strong> {booking.patientName}</p>
                    <p><strong>الخدمة:</strong> {booking.offerName ? `${booking.offerName} (عرض)` : booking.serviceName}</p>
                    <p><strong>الوقت:</strong> {formatTime(new Date(booking.startTime))} - {new Date(booking.startTime).toLocaleDateString('ar-IQ')}</p>
                    <p><strong>الحالة:</strong> {booking.status}</p>
                </div>
                {booking.patientNotes && (
                    <div className="mb-4 p-3 bg-accent/10 border-r-4 border-accent rounded">
                        <h4 className="font-bold text-sm text-accent">ملاحظات المريض</h4>
                        <p className="text-sm text-text-primary mt-1">{booking.patientNotes}</p>
                    </div>
                )}
                <div>
                    <label className="font-semibold block mb-2">ملاحظات المركز (خاصة)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full p-2 bg-surface dark:bg-background border border-border rounded" disabled={booking.status === 'canceled'}></textarea>
                </div>
                <div className="flex justify-between items-center gap-4 pt-6 mt-6 border-t border-border">
                    <div>
                        {booking.status === 'scheduled' && (
                            <button onClick={handleCancel} className="px-6 py-2 bg-error text-white font-bold rounded-lg hover:opacity-90">إلغاء الحجز</button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 bg-surface dark:bg-background rounded-lg">إغلاق</button>
                        <button onClick={handleSave} disabled={booking.status === 'canceled'} className="px-6 py-2 bg-accent text-white font-bold rounded-lg disabled:bg-text-secondary">حفظ الملاحظات</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OffersManager: React.FC<{ center: BeautyCenter; onSave: (offers: OfferPackage[]) => void; isSaving: boolean }> = ({ center, onSave, isSaving }) => {
    const [offers, setOffers] = useState<OfferPackage[]>(() => JSON.parse(JSON.stringify(center.offers || [])));
    const [newOffer, setNewOffer] = useState({ name: '', description: '', price: '' });
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const handleNewOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewOffer(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const handleServiceSelection = (serviceId: string) => {
        setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
    };

    const handleAddOffer = () => {
        if (newOffer.name && newOffer.price && selectedServices.length > 0) {
            const selectedServiceObjects = center.services.filter(s => selectedServices.includes(s.id));
            const originalPrice = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0);
            const duration = selectedServiceObjects.reduce((sum, s) => sum + s.duration, 0);

            setOffers([...offers, { 
                id: generateId(), 
                name: newOffer.name, 
                description: newOffer.description,
                price: Number(newOffer.price), 
                itemIds: selectedServices,
                type: 'service',
                originalPrice,
                duration
            }]);
            setNewOffer({ name: '', description: '', price: '' });
            setSelectedServices([]);
        }
    };

    const handleRemoveOffer = (id: string) => setOffers(offers.filter(o => o.id !== id));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(offers); };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إدارة العروض والباقات</h1>
            <form onSubmit={handleSubmit} className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-3xl mx-auto space-y-6">
                <div className="space-y-4">
                    {offers.map(offer => (
                        <div key={offer.id} className="p-4 border border-border rounded-lg bg-surface dark:bg-background relative">
                            <h3 className="font-bold text-lg">{offer.name}</h3>
                            <p className="text-sm text-text-secondary mb-2">{offer.description}</p>
                            <div className="flex gap-4 text-sm">
                                <span className="font-bold text-accent">{offer.price.toLocaleString('ar-IQ')} د.ع</span>
                                <span className="line-through text-text-secondary opacity-70">{offer.originalPrice.toLocaleString('ar-IQ')} د.ع</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveOffer(offer.id)} className="absolute top-4 left-4 text-error"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                </div>

                <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4">إضافة عرض جديد</h3>
                    <div className="space-y-4">
                        <input name="name" value={newOffer.name} onChange={handleNewOfferChange} placeholder="اسم العرض" className="w-full p-2 bg-surface dark:bg-background border border-border rounded" />
                        <textarea name="description" value={newOffer.description} onChange={handleNewOfferChange} placeholder="وصف العرض" className="w-full p-2 bg-surface dark:bg-background border border-border rounded" rows={2} />
                        
                        <div>
                            <p className="font-semibold mb-2 text-sm">اختر الخدمات المشمولة:</p>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded">
                                {center.services.map(service => (
                                    <label key={service.id} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedServices.includes(service.id)} 
                                            onChange={() => handleServiceSelection(service.id)}
                                            className="rounded text-accent focus:ring-accent"
                                        />
                                        <span className="text-sm">{service.name} ({service.price})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             <input name="price" type="number" value={newOffer.price} onChange={handleNewOfferChange} placeholder="سعر العرض (بعد الخصم)" className="flex-1 p-2 bg-surface dark:bg-background border border-border rounded" />
                             <button type="button" onClick={handleAddOffer} className="px-6 py-2 bg-success text-white font-bold rounded-lg hover:bg-success/90">إضافة</button>
                        </div>
                    </div>
                </div>
                <div className="pt-6"><button type="submit" disabled={isSaving} className="w-full px-6 py-3 bg-accent text-white font-bold rounded-lg shadow-lg hover:bg-accent/90 disabled:opacity-70">{isSaving ? '...' : 'حفظ التغييرات'}</button></div>
            </form>
        </div>
    );
};

const ReportsView: React.FC<{ entityId: string, entityType: 'doctor' | 'beauty_center' | 'laboratory' }> = ({ entityId, entityType }) => {
    const [data, setData] = useState<ReportData | null>(null);
    useEffect(() => {
        api.getReportData(entityId, entityType, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
           .then(r => r.json())
           .then(setData);
    }, [entityId, entityType]);

    if (!data) return <div className="p-8 text-center text-text-secondary">جاري تحميل التقارير...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">التقارير</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="إجمالي الإيرادات" value={`${data.summary.totalRevenue.toLocaleString('ar-IQ')} د.ع`} />
                <StatCard title="إجمالي الحجوزات" value={data.summary.totalBookings.toString()} />
                <StatCard title="نسبة الإكمال" value={`${data.summary.completionRate}%`} />
            </div>
             <div className="mt-8 p-6 bg-background dark:bg-surface rounded-lg shadow">
                 <h2 className="text-xl font-bold mb-4">أفضل الخدمات أداءً</h2>
                 <div className="space-y-4">
                     {data.topServices.map((service, index) => (
                         <div key={index} className="flex justify-between items-center p-3 border-b border-border last:border-0">
                             <span className="font-semibold">{service.name}</span>
                             <div className="text-left">
                                 <span className="block font-bold">{service.count} حجز</span>
                                 <span className="text-xs text-text-secondary">{service.revenue.toLocaleString('ar-IQ')} د.ع</span>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
};

const GalleryManager: React.FC<{ entity: BeautyCenter; onSave: (gallery: GalleryImage[]) => void; isSaving: boolean }> = ({ entity, onSave, isSaving }) => {
    const [gallery, setGallery] = useState<GalleryImage[]>(() => JSON.parse(JSON.stringify(entity.gallery || [])));
    
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
             Array.from(e.target.files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setGallery(prev => [...prev, { id: `img-${Date.now()}-${Math.random()}`, imageUrl: reader.result as string, description: file.name.split('.')[0] }]);
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">معرض الصور</h1>
            <div className="p-8 border-2 border-dashed border-border rounded-xl bg-surface/30 text-center mb-8">
                <PhotoIcon className="w-12 h-12 text-accent mx-auto mb-4" />
                <label className="cursor-pointer bg-accent text-white font-bold py-2 px-8 rounded-lg inline-block hover:opacity-90 transition-opacity">
                    اختيار صور لرفعها
                    <input type="file" multiple accept="image/*" onChange={handleFilesChange} className="hidden" />
                </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {gallery.map(img => (
                <div key={img.id} className="relative bg-background dark:bg-surface rounded-lg shadow-sm overflow-hidden group border border-border">
                    <img src={img.imageUrl} alt={img.description} className="w-full h-40 object-cover" />
                    <div className="p-2">
                        <input 
                            type="text" 
                            value={img.description} 
                            onChange={e => setGallery(p => p.map(i => i.id === img.id ? {...i, description: e.target.value} : i))} 
                            className="w-full text-xs bg-transparent outline-none border-b border-transparent focus:border-accent" 
                            placeholder="وصف الصورة"
                        />
                    </div>
                    <button onClick={() => setGallery(p => p.filter(i => i.id !== img.id))} className="absolute top-2 left-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            ))}
            </div>
            <div className="mt-8 border-t border-border pt-4 text-left">
                <button onClick={() => onSave(gallery)} disabled={isSaving} className="bg-accent text-white font-bold py-2 px-10 rounded-lg disabled:opacity-50">
                    {isSaving ? '...' : 'حفظ المعرض'}
                </button>
            </div>
        </div>
    );
};
