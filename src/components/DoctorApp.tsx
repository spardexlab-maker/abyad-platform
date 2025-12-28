
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Doctor, Appointment, DoctorSchedule, Review, Notification, MedicalRecord, ReportData, PatientBooking, PatientSummary, GalleryImage, BeautyCenter, Laboratory, PublicNote } from '../types';
import * as api from '../services/apiService';
import { ChartBarIcon, CalendarIcon, Cog6ToothIcon, LogoutIcon, UsersIcon, ClockIcon, HomeIcon, SunIcon, MoonIcon, DocumentTextIcon, StarIcon, MapIcon, LocationIcon, BellIcon, MenuIcon, ChevronLeftIcon, ChevronRightIcon, ChartPieIcon, PhotoIcon, TrashIcon, SearchIcon, DocumentArrowDownIcon, PlusCircleIcon } from './Icons';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

declare var Chart: any;
declare var L: any;

const formatTime = (date: Date) => date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatDateToYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];

type DoctorView = 'dashboard' | 'profileSetup' | 'scheduleSettings' | 'appointments' | 'reviews' | 'reports' | 'patients' | 'gallery';

const DoctorApp: React.FC<{ doctor: Doctor; appName: string; }> = ({ doctor, appName }) => {
    const { logout } = useAuthStore();
    const { theme, toggleTheme } = useUiStore();
    
    const [currentView, setCurrentView] = useState<DoctorView>('dashboard');
    const [currentDoctor, setCurrentDoctor] = useState<Doctor>(doctor);
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const checkNotifications = useCallback(async () => {
        await api.generateAppointmentReminders(doctor.id, 'doctor');
        const response = await api.fetchUserNotifications(doctor.id);
        if (response.ok) {
            setNotifications(await response.json());
        }
    }, [doctor.id]);

    useEffect(() => {
        checkNotifications();
        const interval = setInterval(checkNotifications, 60 * 1000);
        return () => clearInterval(interval);
    }, [checkNotifications]);

    const handleOpenNotifications = async () => {
        setIsNotificationsPanelOpen(true);
        notifications.forEach(async (n) => {
            if (!n.read) await api.markNotificationAsRead(n.id);
        });
        setTimeout(checkNotifications, 2000);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleProfileUpdate = async (profileData: Partial<Doctor>) => {
        setIsSaving(true);
        const response = await api.updateDoctorProfile(currentDoctor.id, profileData);
        if (response.ok) {
            setCurrentDoctor(await response.json());
            alert("تم تحديث الملف الشخصي بنجاح!");
        } else {
            alert("فشل تحديث الملف الشخصي.");
        }
        setIsSaving(false);
    };

    const handleScheduleUpdate = async (newSchedule: DoctorSchedule) => {
        setIsSaving(true);
        newSchedule.daysOff = (newSchedule.daysOff || []).sort();
        const response = await api.updateDoctorSchedule(currentDoctor.id, newSchedule);
        if (response.ok) {
            setCurrentDoctor(await response.json());
            alert("تم تحديث الجدول بنجاح!");
        }
        setIsSaving(false);
    };
    
    const onAppointmentChange = (changedAppointment: Appointment) => {
        const updatedAppointments = currentDoctor.appointments.map(a => a.id === changedAppointment.id ? changedAppointment : a);
        if (!currentDoctor.appointments.find(a => a.id === changedAppointment.id)) {
            updatedAppointments.push(changedAppointment);
        }
        setCurrentDoctor(prev => ({ ...prev, appointments: updatedAppointments }));
    };

    const handleGalleryUpdate = async (gallery: GalleryImage[]) => {
        setIsSaving(true);
        const response = await api.updateDoctorGallery(currentDoctor.id, gallery);
        if(response.ok) {
            setCurrentDoctor(await response.json());
            alert("تم حفظ معرض الصور بنجاح!");
        } else {
            alert("فشل تحديث المعرض.");
        }
        setIsSaving(false);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardView doctor={currentDoctor} />;
            case 'profileSetup': return <ProfileSetupView doctor={currentDoctor} onSave={handleProfileUpdate} isSaving={isSaving} />;
            case 'scheduleSettings': return <ScheduleSettingsView schedule={currentDoctor.schedule} onSave={handleScheduleUpdate} isSaving={isSaving} />;
            case 'appointments': return <AppointmentsManager doctor={currentDoctor} onAppointmentChange={onAppointmentChange} />;
            case 'reviews': return <ReviewsView doctor={currentDoctor} />;
            case 'reports': return <ReportsView entityId={currentDoctor.id} entityType="doctor" />;
            case 'patients': return <PatientManagerView doctorId={currentDoctor.id} />;
            case 'gallery': return <GalleryManager entity={currentDoctor} onSave={handleGalleryUpdate} isSaving={isSaving} />;
            default: return <DashboardView doctor={currentDoctor} />;
        }
    };

    return (
        <div className="flex h-screen bg-surface dark:bg-background text-text-primary transition-colors duration-300">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            <aside className={`w-64 flex-shrink-0 bg-background dark:bg-surface border-l dark:border-border flex flex-col fixed md:relative inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                <div className="h-16 flex items-center justify-center border-b border-border px-4"><h1 className="text-2xl font-bold text-primary truncate">{appName}</h1></div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={HomeIcon} label="لوحة التحكم" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                    <NavItem icon={UsersIcon} label="الملف الشخصي" active={currentView === 'profileSetup'} onClick={() => setCurrentView('profileSetup')} />
                    <NavItem icon={UsersIcon} label="مرضاي" active={currentView === 'patients'} onClick={() => setCurrentView('patients')} />
                    <NavItem icon={CalendarIcon} label="إعداد الجدول" active={currentView === 'scheduleSettings'} onClick={() => setCurrentView('scheduleSettings')} />
                    <NavItem icon={ClockIcon} label="إدارة المواعيد" active={currentView === 'appointments'} onClick={() => setCurrentView('appointments')} />
                    <NavItem icon={StarIcon} label="التقييمات" active={currentView === 'reviews'} onClick={() => setCurrentView('reviews')} />
                    <NavItem icon={PhotoIcon} label="معرض الصور" active={currentView === 'gallery'} onClick={() => setCurrentView('gallery')} />
                    <NavItem icon={ChartPieIcon} label="التقارير" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
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
                 <header className="h-16 flex-shrink-0 bg-background dark:bg-surface border-b border-border flex items-center justify-between md:justify-end px-4 md:px-8">
                     <button onClick={handleOpenNotifications} className="relative">
                        <BellIcon className="w-6 h-6 text-text-secondary"/>
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-xs text-white">{unreadCount}</span>}
                    </button>
                    <button className="md:hidden text-text-secondary" onClick={() => setIsSidebarOpen(true)}><MenuIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8"><div className="fade-in">{renderContent()}</div></main>
            </div>
             {isNotificationsPanelOpen && <NotificationsPanel notifications={notifications} onClose={() => setIsNotificationsPanelOpen(false)} />}
        </div>
    );
};

const NavItem: React.FC<{ icon: React.ElementType, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (<a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-4 py-2 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-surface dark:hover:bg-background'}`}><Icon className="w-5 h-5 ml-3" />{label}</a>);

const DashboardView: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todaysAppointments = doctor.appointments.filter(a => new Date(a.startTime).toISOString().split('T')[0] === todayStr && a.status === 'scheduled');
    const completedThisMonth = doctor.appointments.filter(a => a.status === 'completed' && new Date(a.startTime).getMonth() === today.getMonth()).length;
    const estimatedIncome = (completedThisMonth * (doctor.consultationFee || 0)).toLocaleString('ar-IQ');
    const uniquePatientsThisMonth = new Set(doctor.appointments.filter(a => new Date(a.startTime).getMonth() === today.getMonth()).map(a => a.patientId)).size;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً، {doctor.name}</h1>
            <p className="text-text-secondary mb-8">إليك ملخص نشاطك اليوم.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="مواعيد اليوم" value={todaysAppointments.length.toString()} />
                <StatCard title="الدخل الشهري المتوقع" value={`${estimatedIncome} دينار عراقي`} />
                <StatCard title="المرضى الجدد (هذا الشهر)" value={uniquePatientsThisMonth.toString()} />
            </div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">مواعيد اليوم</h2>
                {todaysAppointments.length > 0 ? (
                    <div className="space-y-3">
                        {todaysAppointments.map(apt => (
                            <div key={apt.id} className="flex justify-between items-center p-3 bg-surface dark:bg-background rounded-lg">
                                <span className="font-semibold">{apt.patientName}</span>
                                <span className="text-primary font-bold">{formatTime(new Date(apt.startTime))}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-text-secondary text-center py-4">لا توجد مواعيد مجدولة لهذا اليوم.</p>}
            </div>
        </div>
    );
};

const LocationPickerMap: React.FC<{ initialLocation: [number, number]; onLocationChange: (lat: number, lng: number) => void; }> = ({ initialLocation, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView(initialLocation, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            const marker = L.marker(initialLocation, { draggable: true }).addTo(map);
            marker.on('dragend', (event: any) => onLocationChange(event.target.getLatLng().lat, event.target.getLatLng().lng));
            map.on('click', (event: any) => { marker.setLatLng(event.latlng); onLocationChange(event.latlng.lat, event.latlng.lng); });
            mapInstanceRef.current = map;
        }
    }, [initialLocation, onLocationChange]);
    return <div ref={mapContainerRef} className="h-64 w-full rounded-lg" />;
};

const ProfileSetupView: React.FC<{ doctor: Doctor; onSave: (data: Partial<Doctor>) => void; isSaving: boolean }> = ({ doctor, onSave, isSaving }) => {
    const [formData, setFormData] = useState({ name: doctor.name, specialty: doctor.specialty, experienceYears: doctor.experienceYears, location: doctor.location, bio: doctor.bio, consultationFee: doctor.consultationFee || 0, lat: doctor.lat, lng: doctor.lng });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: (name === 'experienceYears' || name === 'consultationFee') ? Number(value) : value }));
    };
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إعداد الملف الشخصي</h1>
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-2xl mx-auto space-y-4">
                <div><label className="font-semibold">الاسم الكامل</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div><label className="font-semibold">التخصص</label><input name="specialty" type="text" value={formData.specialty} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div><label className="font-semibold">سنوات الخبرة</label><input name="experienceYears" type="number" value={formData.experienceYears} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div><label className="font-semibold">تحديد الموقع</label><LocationPickerMap initialLocation={[formData.lat, formData.lng]} onLocationChange={(lat, lng) => setFormData(p => ({...p, lat, lng}))} /></div>
                <div><label className="font-semibold">سعر الكشفية</label><input name="consultationFee" type="number" value={formData.consultationFee} onChange={handleChange} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded" /></div>
                <div><label className="font-semibold">نبذة تعريفية</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full mt-1 p-2 bg-surface dark:bg-background border border-border rounded"></textarea></div>
                <div className="pt-4"><button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white font-bold rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400">{isSaving ? '...' : 'حفظ التغييرات'}</button></div>
            </form>
        </div>
    );
};

const AppointmentsManager: React.FC<{ doctor: Doctor; onAppointmentChange: (apt: Appointment) => void }> = ({ doctor, onAppointmentChange }) => {
    const [modalState, setModalState] = useState<{ type: 'new' | 'details'; data: Appointment | Date | null; isOpen: boolean }>({ type: 'new', data: null, isOpen: false });
    const [viewMode, setViewMode] = useState<'agenda' | 'calendar'>('agenda');
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">إدارة المواعيد</h2>
                <div className="p-1 bg-surface dark:bg-background rounded-lg flex items-center">
                    <button onClick={() => setViewMode('agenda')} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${viewMode === 'agenda' ? 'bg-background shadow' : 'text-text-secondary'}`}>قائمة اليوم</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${viewMode === 'calendar' ? 'bg-background shadow' : 'text-text-secondary'}`}>التقويم الشهري</button>
                </div>
            </div>
            {viewMode === 'agenda' ? <DailyAgendaView appointments={doctor.appointments} onAppointmentClick={a => setModalState({ type: 'details', data: a, isOpen: true })} onAddNewClick={d => setModalState({ type: 'new', data: d, isOpen: true })} /> : <div className="p-6 bg-background dark:bg-surface rounded-lg shadow"><MonthlyCalendarView doctor={doctor} onSlotClick={d => setModalState({ type: 'new', data: d, isOpen: true })} onAppointmentClick={a => setModalState({ type: 'details', data: a, isOpen: true })} /></div>}
            {modalState.isOpen && modalState.type === 'new' && <AppointmentBookingModal doctorId={doctor.id} onClose={() => setModalState({ isOpen: false, type: 'new', data: null })} onAppointmentBooked={onAppointmentChange} initialDateTime={modalState.data as Date} />}
            {modalState.isOpen && modalState.type === 'details' && <AppointmentDetailsModal appointment={modalState.data as Appointment} onClose={() => setModalState({ isOpen: false, type: 'new', data: null })} onAppointmentChange={onAppointmentChange} />}
        </div>
    );
};

const DailyAgendaView: React.FC<{ appointments: Appointment[]; onAppointmentClick: (a: Appointment) => void; onAddNewClick: (d: Date) => void; }> = ({ appointments, onAppointmentClick, onAddNewClick }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const todaysAppointments = useMemo(() => appointments.filter(a => new Date(a.startTime).toDateString() === selectedDate.toDateString()).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), [appointments, selectedDate]);
    return (
        <div className="bg-background dark:bg-surface rounded-lg shadow-lg">
            <div className="p-4 border-b border-border flex justify-between items-center">
                <div className="flex gap-2">
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d); }} className="p-2"><ChevronRightIcon className="w-5 h-5" /></button>
                    <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 text-sm font-semibold">اليوم</button>
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d); }} className="p-2"><ChevronLeftIcon className="w-5 h-5" /></button>
                </div>
                <h3 className="font-bold">{selectedDate.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            </div>
            <div className="p-4 min-h-[400px]">
                {todaysAppointments.length > 0 ? todaysAppointments.map(apt => (
                    <div key={apt.id} onClick={() => onAppointmentClick(apt)} className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 border-r-4 ${apt.status === 'scheduled' ? 'border-primary bg-primary/10' : 'border-success bg-success/10'}`}>
                        <div className="flex-1"><p className="font-bold">{apt.patientName}</p><p className="text-sm text-text-secondary">{formatTime(new Date(apt.startTime))}</p></div>
                        <span className="text-xs font-semibold">{apt.status}</span>
                    </div>
                )) : <div className="text-center py-16 text-text-secondary">لا توجد مواعيد.</div>}
            </div>
            <div className="p-4 border-t border-border text-center"><button onClick={() => onAddNewClick(selectedDate)} className="bg-primary text-white font-bold py-2 px-5 rounded-lg">إضافة موعد +</button></div>
        </div>
    );
};

const MonthlyCalendarView: React.FC<{ doctor: Doctor; onSlotClick: (date: Date) => void; onAppointmentClick: (apt: Appointment) => void }> = ({ doctor, onSlotClick, onAppointmentClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const startDayOfWeek = startOfMonth.getDay();
    const days = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))}>&lt;</button>
                <h3 className="font-bold text-lg">{currentDate.toLocaleString('ar-IQ', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))}>&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-text-secondary mb-2">{days.map(d => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 border-t border-r border-border">
                {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} className="border-b border-l border-border h-24 bg-surface/30"></div>)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayApts = doctor.appointments.filter(a => new Date(a.startTime).toDateString() === date.toDateString());
                    return (
                        <div key={day} onClick={() => onSlotClick(date)} className="border-b border-l border-border h-24 p-1 cursor-pointer hover:bg-surface transition-colors overflow-y-auto">
                            <div className="text-center font-bold text-xs">{day}</div>
                            {dayApts.map(a => <div key={a.id} onClick={e => { e.stopPropagation(); onAppointmentClick(a); }} className="text-[10px] bg-primary/20 text-primary rounded px-1 mb-1 truncate">{a.patientName}</div>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AppointmentBookingModal: React.FC<{ doctorId: string; onClose: () => void; onAppointmentBooked: (apt: Appointment) => void; initialDateTime: Date; }> = ({ doctorId, onClose, onAppointmentBooked, initialDateTime }) => {
    const [patientName, setPatientName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [time, setTime] = useState(initialDateTime.toISOString().slice(0, 16));
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await api.bookAppointment({ doctorId, patientId: `guest-${Date.now()}`, patientName, startTime: new Date(time) });
        if (res.ok) { onAppointmentBooked(await res.json()); onClose(); }
        else { alert("فشل الحجز."); setIsSaving(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-background dark:bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold mb-4">إضافة موعد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block font-semibold mb-1">اسم المريض</label><input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full p-2 border border-border rounded" required /></div>
                    <div><label className="block font-semibold mb-1">الوقت</label><input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border border-border rounded" required /></div>
                    <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onClose} className="px-4 py-2">إلغاء</button><button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded-lg">{isSaving ? '...' : 'حفظ'}</button></div>
                </form>
            </div>
        </div>
    );
};

const AppointmentDetailsModal: React.FC<{ appointment: Appointment; onClose: () => void; onAppointmentChange: (apt: Appointment) => void }> = ({ appointment, onClose, onAppointmentChange }) => {
    const [notes, setNotes] = useState(appointment.doctorNotes || '');
    const handleSave = async () => {
        const res = await api.updateAppointmentNotes(appointment.id, notes);
        if (res.ok) { onAppointmentChange(await res.json()); onClose(); }
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-background dark:bg-surface p-6 rounded-lg w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold mb-4">تفاصيل الموعد</h2>
                <div className="space-y-2 mb-4">
                    <p><strong>المريض:</strong> {appointment.patientName}</p>
                    <p><strong>الوقت:</strong> {new Date(appointment.startTime).toLocaleString('ar-IQ')}</p>
                    <p><strong>الحالة:</strong> {appointment.status}</p>
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border border-border rounded mb-4" placeholder="ملاحظات الطبيب..."></textarea>
                <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2">إغلاق</button><button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-lg">حفظ الملاحظات</button></div>
            </div>
        </div>
    );
};

const ReviewsView: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    useEffect(() => { api.fetchDoctorReviews(doctor.id).then(r => r.json()).then(setReviews); }, [doctor.id]);
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">تقييمات المرضى</h1>
            <div className="space-y-4">{reviews.map(r => (
                <div key={r.id} className="p-4 bg-background dark:bg-surface rounded-lg shadow">
                    <div className="flex justify-between"><strong>{r.patientName}</strong><StarRating rating={r.rating} className="w-4 h-4" /></div>
                    <p className="mt-2 text-text-secondary">{r.comment}</p>
                </div>
            ))}</div>
        </div>
    );
};

const ReportsView: React.FC<{ entityId: string, entityType: 'doctor' | 'beauty_center' | 'laboratory' }> = ({ entityId, entityType }) => {
    const [data, setData] = useState<ReportData | null>(null);
    useEffect(() => { api.getReportData(entityId, entityType, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).then(r => r.json()).then(setData); }, [entityId, entityType]);
    if (!data) return <div>جاري التحميل...</div>;
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">التقارير</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="إجمالي الإيرادات" value={`${data.summary.totalRevenue} د.ع`} />
                <StatCard title="إجمالي الحجوزات" value={data.summary.totalBookings.toString()} />
                <StatCard title="نسبة الإكمال" value={`${data.summary.completionRate}%`} />
            </div>
        </div>
    );
};

const PatientManagerView: React.FC<{ doctorId: string }> = ({ doctorId }) => {
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    useEffect(() => { api.getDoctorPatients(doctorId).then(r => r.json()).then(setPatients); }, [doctorId]);
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">قائمة المرضى</h1>
            <div className="bg-background dark:bg-surface rounded-lg shadow overflow-x-auto">
                <table className="w-full text-right">
                    <thead><tr className="border-b border-border"><th className="p-3">الاسم</th><th className="p-3">المواعيد</th><th className="p-3">آخر زيارة</th></tr></thead>
                    <tbody>{patients.map(p => (<tr key={p.id} className="border-b border-border"><td className="p-3 font-semibold">{p.name}</td><td className="p-3">{p.totalAppointments}</td><td className="p-3">{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('ar-IQ') : 'N/A'}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
};

const ScheduleSettingsView: React.FC<{ schedule: DoctorSchedule; onSave: (newSchedule: DoctorSchedule) => void; isSaving: boolean }> = ({ schedule, onSave, isSaving }) => {
    const [current, setCurrent] = useState(schedule);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrent(p => ({...p, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value}));
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إعدادات الجدول</h1>
            <form onSubmit={e => { e.preventDefault(); onSave(current); }} className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block font-semibold mb-1">بدء العمل</label><input type="time" name="startTime" value={current.startTime} onChange={handleChange} className="w-full p-2 bg-surface dark:bg-background border border-border rounded"/></div>
                    <div><label className="block font-semibold mb-1">نهاية العمل</label><input type="time" name="endTime" value={current.endTime} onChange={handleChange} className="w-full p-2 border border-border rounded"/></div>
                </div>
                <div><label className="block font-semibold mb-1">مدة الكشفية (دقائق)</label><input type="number" name="appointmentDurationMinutes" value={current.appointmentDurationMinutes} onChange={handleChange} className="w-full p-2 border border-border rounded"/></div>
                <div className="pt-4"><button type="submit" disabled={isSaving} className="bg-primary text-white font-bold py-2 px-6 rounded-lg">{isSaving ? '...' : 'حفظ'}</button></div>
            </form>
        </div>
    );
};

const GalleryManager: React.FC<{ entity: Doctor | BeautyCenter | Laboratory; onSave: (gallery: GalleryImage[]) => void; isSaving: boolean }> = ({ entity, onSave, isSaving }) => {
    const [gallery, setGallery] = useState<GalleryImage[]>(() => JSON.parse(JSON.stringify(entity.gallery || [])));
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Explicitly typed 'file' as 'File' to avoid TS 'unknown' errors when accessing 'name' and passing to 'readAsDataURL'.
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
                <PhotoIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <label className="cursor-pointer bg-primary text-white font-bold py-2 px-8 rounded-lg">اختيار صور لرفعها<input type="file" multiple accept="image/*" onChange={handleFilesChange} className="hidden" /></label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">{gallery.map(img => (
                <div key={img.id} className="relative bg-background dark:bg-surface rounded-lg shadow-sm overflow-hidden group border border-border">
                    <img src={img.imageUrl} className="w-full h-40 object-cover" />
                    <div className="p-2"><input type="text" value={img.description} onChange={e => setGallery(p => p.map(i => i.id === img.id ? {...i, description: e.target.value} : i))} className="w-full text-xs bg-transparent outline-none border-b border-transparent focus:border-primary" /></div>
                    <button onClick={() => setGallery(p => p.filter(i => i.id !== img.id))} className="absolute top-2 left-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                </div>
            ))}</div>
            <div className="mt-8 border-t border-border pt-4 text-left"><button onClick={() => onSave(gallery)} disabled={isSaving} className="bg-primary text-white font-bold py-2 px-10 rounded-lg">{isSaving ? '...' : 'حفظ المعرض'}</button></div>
        </div>
    );
};

const StatCard: React.FC<{title: string; value: string; critical?: boolean}> = ({title, value, critical}) => (<div className={`p-6 bg-background dark:bg-surface rounded-lg shadow transition-transform transform hover:scale-105 ${critical ? 'border-2 border-error' : ''}`}><h3 className="text-text-secondary mb-2">{title}</h3><p className={`text-2xl font-bold ${critical ? 'text-error' : ''}`}>{value}</p></div>);

const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className = "w-5 h-5" }) => (<div className="flex">{[...Array(5)].map((_, i) => <StarIcon key={i} className={`${className} ${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}</div>);

const NotificationsPanel: React.FC<{notifications: Notification[], onClose: () => void}> = ({notifications, onClose}) => (
    <div className="fixed inset-0 bg-black/30 z-[70]" onClick={onClose}>
        <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-background dark:bg-surface shadow-xl p-4 flex flex-col z-[80]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">الإشعارات</h2><button onClick={onClose} className="text-2xl">&times;</button></div>
            <div className="flex-1 overflow-y-auto space-y-3">{notifications.map(n => (<div key={n.id} className={`p-3 rounded border-b border-border ${!n.read ? 'bg-primary/5' : ''}`}><p className="text-sm">{n.message}</p><p className="text-xs text-text-secondary mt-1">{new Date(n.timestamp).toLocaleString('ar-IQ')}</p></div>))}</div>
        </div>
    </div>
);

export default DoctorApp;
