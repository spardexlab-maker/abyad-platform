
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Laboratory, LabBooking, DoctorSchedule, Notification, LabTest, ReportData, PatientBooking, GalleryImage, Doctor, BeautyCenter, OfferPackage } from '../types';
import { HomeIcon, UsersIcon, CalendarIcon, ClockIcon, Cog6ToothIcon, LogoutIcon, SunIcon, MoonIcon, MenuIcon, BeakerIcon, PlusCircleIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ChartPieIcon, PhotoIcon, DocumentArrowDownIcon, TagIcon, StarIcon } from './Icons';
import * as api from '../services/apiService';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

declare var Chart: any;
declare var L: any;

const formatTime = (date: Date) => date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatDateToYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];
const generateId = () => Math.random().toString(36).substr(2, 9);

type LaboratoryView = 'dashboard' | 'profileSetup' | 'tests' | 'scheduleSettings' | 'bookings' | 'reports' | 'gallery' | 'offers';

const LocationPickerMap: React.FC<{ initialLocation: [number, number]; onLocationChange: (lat: number, lng: number) => void; }> = ({ initialLocation, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView(initialLocation, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            const marker = L.marker(initialLocation, { draggable: true }).addTo(map);
            marker.on('dragend', (event: any) => onLocationChange(event.target.getLatLng().lat, event.target.getLatLng().lng));
            mapInstanceRef.current = map;
        }
    }, [initialLocation, onLocationChange]);
    return <div ref={mapContainerRef} className="h-64 w-full rounded-lg" />;
};

const GalleryManager: React.FC<{ entity: Laboratory; onSave: (gallery: GalleryImage[]) => void; isSaving: boolean }> = ({ entity, onSave, isSaving }) => {
    const [gallery, setGallery] = useState<GalleryImage[]>(() => JSON.parse(JSON.stringify(entity.gallery || [])));
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Explicitly typed 'file' as 'File' to avoid 'unknown' type errors when accessing 'name' and passing to 'readAsDataURL'.
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
            <h1 className="text-3xl font-bold mb-8 text-primary">إدارة معرض الصور</h1>
            <div className="p-8 border-2 border-dashed border-border rounded-xl bg-surface/30 text-center mb-8">
                <PhotoIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <label className="cursor-pointer bg-primary text-white font-bold py-2 px-8 rounded-lg shadow-lg hover:scale-105 transition-transform inline-block">اختيار صور لرفعها<input type="file" multiple accept="image/*" onChange={handleFilesChange} className="hidden" /></label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">{gallery.map(img => (
                <div key={img.id} className="relative bg-background dark:bg-surface rounded-lg shadow-sm overflow-hidden group border border-border">
                    <img src={img.imageUrl} className="w-full h-40 object-cover" />
                    <div className="p-2"><input type="text" value={img.description} onChange={e => setGallery(p => p.map(i => i.id === img.id ? {...i, description: e.target.value} : i))} className="w-full text-xs bg-transparent outline-none focus:border-primary border-b border-transparent" /></div>
                    <button onClick={() => setGallery(p => p.filter(i => i.id !== img.id))} className="absolute top-2 left-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                </div>
            ))}</div>
            <div className="mt-8 border-t border-border pt-4 text-left"><button onClick={() => onSave(gallery)} disabled={isSaving} className="bg-primary text-white font-bold py-2 px-10 rounded-lg">{isSaving ? 'جاري الحفظ...' : 'تحديث المعرض'}</button></div>
        </div>
    );
};

const DashboardView: React.FC<{ lab: Laboratory }> = ({ lab }) => {
    const today = new Date();
    const todaysBookings = lab.bookings.filter(b => new Date(b.startTime).toDateString() === today.toDateString() && b.status === 'scheduled');
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">مرحباً، {lab.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title="حجوزات اليوم" value={todaysBookings.length.toString()} />
                <StatCard title="إجمالي الفحوصات" value={lab.tests.length.toString()} />
            </div>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow"><h2 className="text-xl font-semibold mb-4">حجوزات اليوم</h2>{todaysBookings.length > 0 ? todaysBookings.map(b => (<div key={b.id} className="p-3 bg-surface dark:bg-background rounded mb-2 flex justify-between"><span>{b.patientName}</span><span className="font-bold">{formatTime(new Date(b.startTime))}</span></div>)) : <p className="text-center py-4 text-text-secondary">لا توجد حجوزات لليوم.</p>}</div>
        </div>
    );
};

const TestsManager: React.FC<{ lab: Laboratory; onSave: (tests: LabTest[]) => void; isSaving: boolean }> = ({ lab, onSave, isSaving }) => {
    const [tests, setTests] = useState<LabTest[]>(() => JSON.parse(JSON.stringify(lab.tests)));
    const [newTest, setNewTest] = useState({ name: '', price: '', duration: '' });
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إدارة الفحوصات</h1>
            <div className="p-6 bg-background dark:bg-surface rounded-lg shadow space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">{tests.map(t => (<div key={t.id} className="flex justify-between items-center p-2 bg-surface dark:bg-background rounded"><span>{t.name}</span><div className="flex gap-4 items-center"><span>{t.price} د.ع</span><button onClick={() => setTests(tests.filter(ti => ti.id !== t.id))} className="text-error"><TrashIcon className="w-5 h-5"/></button></div></div>))}</div>
                <div className="pt-4 border-t border-border"><h3 className="font-bold mb-2">إضافة فحص جديد</h3><div className="flex gap-2"><input placeholder="الاسم" value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} className="flex-1 p-2 border border-border rounded" /><input placeholder="السعر" type="number" value={newTest.price} onChange={e => setNewTest({...newTest, price: e.target.value})} className="w-24 p-2 border border-border rounded" /><input placeholder="المدة" type="number" value={newTest.duration} onChange={e => setNewTest({...newTest, duration: e.target.value})} className="w-20 p-2 border border-border rounded" /><button onClick={() => { if(newTest.name && newTest.price) { setTests([...tests, {id: generateId(), name: newTest.name, price: Number(newTest.price), duration: Number(newTest.duration)}]); setNewTest({name: '', price: '', duration: ''}); }}} className="p-2 text-success"><PlusCircleIcon className="w-6 h-6"/></button></div></div>
                <div className="pt-4"><button onClick={() => onSave(tests)} disabled={isSaving} className="bg-primary text-white font-bold py-2 px-6 rounded-lg w-full">{isSaving ? '...' : 'حفظ الفحوصات'}</button></div>
            </div>
        </div>
    );
};

const BookingsManager: React.FC<{ lab: Laboratory, onBookingChange: (b: LabBooking) => void }> = ({ lab, onBookingChange }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const dayBookings = lab.bookings.filter(b => new Date(b.startTime).toDateString() === viewDate.toDateString());
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">إدارة الحجوزات</h1>
            <div className="bg-background dark:bg-surface p-4 rounded-lg shadow"><div className="flex justify-between items-center mb-6"><button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate()-1)))}>&lt;</button><h3 className="font-bold">{viewDate.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3><button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate()+1)))}>&gt;</button></div><div className="space-y-3">{dayBookings.map(b => (<div key={b.id} className="p-4 border border-border rounded flex justify-between items-center"><div><p className="font-bold">{b.patientName}</p><p className="text-sm text-text-secondary">{b.testName}</p></div><div className="text-left"><p className="font-bold text-primary">{formatTime(new Date(b.startTime))}</p><p className="text-xs">{b.status}</p></div></div>))}</div></div>
        </div>
    );
};

const StatCard: React.FC<{title: string; value: string;}> = ({title, value}) => (<div className="p-6 bg-background dark:bg-surface rounded-lg shadow transition-transform transform hover:scale-105"><h3 className="text-text-secondary mb-2">{title}</h3><p className="text-2xl font-bold">{value}</p></div>);

const NavItem: React.FC<{ icon: React.ElementType, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (<a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} className={`flex items-center px-4 py-2 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-surface dark:hover:bg-background'}`}><Icon className="w-5 h-5 ml-3" />{label}</a>);

export const LaboratoryApp: React.FC<{ lab: Laboratory; appName: string; }> = ({ lab, appName }) => {
    const [currentView, setCurrentView] = useState<LaboratoryView>('dashboard');
    const [currentLab, setCurrentLab] = useState<Laboratory>(lab);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout } = useAuthStore();
    const { theme, toggleTheme } = useUiStore();

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <DashboardView lab={currentLab} />;
            case 'profileSetup': return <div className="p-6 bg-background dark:bg-surface rounded-lg shadow max-w-2xl mx-auto"><h2 className="text-2xl font-bold mb-4">الملف الشخصي</h2><LocationPickerMap initialLocation={[currentLab.lat, currentLab.lng]} onLocationChange={(lat, lng) => setCurrentLab(p => ({...p, lat, lng}))} /><div className="mt-4"><button onClick={() => { setIsSaving(true); api.updateLaboratoryProfile(currentLab.id, currentLab).then(() => { setIsSaving(false); alert("تم الحفظ"); }); }} className="bg-primary text-white py-2 px-8 rounded-lg">{isSaving ? '...' : 'حفظ الموقع'}</button></div></div>;
            case 'tests': return <TestsManager lab={currentLab} onSave={tests => { setIsSaving(true); api.updateLaboratoryTests(currentLab.id, tests).then(r => r.json()).then(l => { setCurrentLab(l); setIsSaving(false); alert("تم الحفظ"); }); }} isSaving={isSaving} />;
            case 'bookings': return <BookingsManager lab={currentLab} onBookingChange={b => setCurrentLab(p => ({...p, bookings: p.bookings.map(bi => bi.id === b.id ? b : bi)}))} />;
            case 'gallery': return <GalleryManager entity={currentLab} onSave={g => { setIsSaving(true); api.updateLaboratoryGallery(currentLab.id, g).then(r => r.json()).then(l => { setCurrentLab(l); setIsSaving(false); alert("تم الحفظ"); }); }} isSaving={isSaving} />;
            default: return <DashboardView lab={currentLab} />;
        }
    };

    return (
        <div className="flex h-screen bg-surface dark:bg-background text-text-primary transition-colors duration-300">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            <aside className={`w-64 flex-shrink-0 bg-background dark:bg-surface border-l dark:border-border flex flex-col fixed md:relative inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                <div className="h-16 flex items-center justify-center border-b border-border px-4"><h1 className="text-2xl font-bold text-primary truncate">{appName}</h1></div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={HomeIcon} label="لوحة التحكم" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                    <NavItem icon={BeakerIcon} label="إدارة الفحوصات" active={currentView === 'tests'} onClick={() => setCurrentView('tests')} />
                    <NavItem icon={ClockIcon} label="إدارة الحجوزات" active={currentView === 'bookings'} onClick={() => setCurrentView('bookings')} />
                    <NavItem icon={PhotoIcon} label="معرض الصور" active={currentView === 'gallery'} onClick={() => setCurrentView('gallery')} />
                    <NavItem icon={UsersIcon} label="الملف الشخصي" active={currentView === 'profileSetup'} onClick={() => setCurrentView('profileSetup')} />
                </nav>
                <div className="p-4 border-t border-border">
                     <button onClick={toggleTheme} className="w-full flex items-center justify-center px-4 py-2 mb-2 text-text-secondary rounded-lg hover:bg-surface dark:hover:bg-background transition-colors">{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</button>
                    <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2 text-text-secondary rounded-lg hover:bg-error/10 hover:text-error transition-colors">تسجيل الخروج</button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 flex-shrink-0 bg-background dark:bg-surface border-b border-border flex items-center justify-end px-4 md:px-8"><button className="md:hidden text-text-secondary" onClick={() => setIsSidebarOpen(true)}><MenuIcon className="w-6 h-6" /></button></header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8"><div className="fade-in">{renderContent()}</div></main>
            </div>
        </div>
    );
};
