
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Doctor, User, Appointment, Review, MedicalRecord, BeautyCenter, PatientBooking, BeautyService, Laboratory, LabTest, LabBooking, GalleryImage, OfferPackage, PublicNote, BeautyBooking } from '../types';
import { AppView } from '../types';
import type { Theme } from '../App';
import * as api from '../services/apiService';
import { HomeIcon, UsersIcon, ClockIcon, SunIcon, MoonIcon, StarIcon, SearchIcon, LocationIcon, LogoutIcon, DocumentTextIcon, MenuIcon, PlusCircleIcon, TrashIcon, MapPinIcon, SparklesIcon, BeakerIcon, ChevronLeftIcon, ChevronRightIcon, FacebookIcon, InstagramIcon, WhatsAppIcon, TagIcon, DocumentArrowDownIcon } from './Icons';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';


// Let TypeScript know about the Leaflet global object
declare var L: any;

// --- HELPER FUNCTIONS ---

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};


const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className = "w-5 h-5" }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => <StarIcon key={i} className={`${className} ${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}
    </div>
);

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = "h-12 w-12" }) => (
    <div className="flex justify-center items-center p-8">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${size}`}></div>
    </div>
);

// --- MAIN PATIENT APP & LAYOUT ---
export const PatientApp: React.FC = () => {
    const { currentView } = useUiStore();

    const renderContent = () => {
        switch (currentView) {
            case AppView.PatientDoctorList:
                return <PatientDoctorList />;
            case AppView.PatientDoctorProfile:
                return <PatientDoctorProfile />;
            case AppView.PatientBookingConfirmation:
                return <PatientBookingConfirmation />;
            case AppView.PatientAppointments:
                return <PatientAppointments />;
            case AppView.PatientProfile:
                return <PatientProfile />;
            case AppView.PatientMedicalRecord:
                return <PatientMedicalRecordView />;
            case AppView.PatientBeautyCenterList:
                return <PatientBeautyCenterList />;
            case AppView.PatientBeautyCenterProfile:
                return <PatientBeautyCenterProfile />;
            case AppView.PatientBeautyBookingConfirmation:
                 return <PatientBookingConfirmation isBeauty={true} />;
            case AppView.PatientLabList:
                return <PatientLabList />;
            case AppView.PatientLabProfile:
                return <PatientLabProfile />;
            case AppView.PatientLabBookingConfirmation:
                return <PatientBookingConfirmation isLab={true} />;
            case AppView.PatientHome:
            default:
                return <PatientHome />;
        }
    };

    return (
        <PatientLayout>
            {renderContent()}
        </PatientLayout>
    );
};

const PatientLayout: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
    const { navigate, currentView, goBack, history } = useUiStore();
    
    const navItems = [
        { view: AppView.PatientHome, icon: HomeIcon, label: 'الرئيسية' },
        { view: AppView.PatientDoctorList, icon: SearchIcon, label: 'الأطباء' },
        { view: AppView.PatientBeautyCenterList, icon: SparklesIcon, label: 'التجميل' },
        { view: AppView.PatientLabList, icon: BeakerIcon, label: 'المختبرات' },
        { view: AppView.PatientAppointments, icon: ClockIcon, label: 'مواعيدي' },
    ];
    
    const viewMap: {[key in AppView]?: AppView} = {
        [AppView.PatientDoctorProfile]: AppView.PatientDoctorList,
        [AppView.PatientBeautyCenterProfile]: AppView.PatientBeautyCenterList,
        [AppView.PatientLabProfile]: AppView.PatientLabList,
        [AppView.PatientMedicalRecord]: AppView.PatientAppointments,
        [AppView.PatientProfile]: AppView.PatientAppointments,
    };
    const getBaseView = (view: AppView) => viewMap[view] || view;
    const activeBaseView = getBaseView(currentView);
    
    const canGoBack = history.length > 0;

    return (
        <div className="max-w-md mx-auto h-full flex flex-col bg-background dark:bg-background relative">
            {/* Header / Back Button Area for sub-pages - Visual Improvement */}
            {canGoBack && currentView !== AppView.PatientHome && (
               <div className="absolute top-4 left-4 z-50">
                   <button onClick={() => goBack()} className="p-3 bg-white/90 dark:bg-surface/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:scale-105 active:scale-95 transition-transform touch-manipulation">
                       <ChevronLeftIcon className="w-6 h-6 text-primary" />
                   </button>
               </div>
            )}

            <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] scrollbar-hide">
                {children}
            </main>
            
            <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-surface/95 backdrop-blur border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[2rem] pb-[env(safe-area-inset-bottom)] z-40 transition-all">
                <nav className="flex justify-around items-center h-20">
                    {navItems.map(item => (
                         <button key={item.view} onClick={() => navigate(item.view)} className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 touch-manipulation ${activeBaseView === item.view ? 'text-primary' : 'text-text-secondary opacity-60'}`}>
                            <item.icon className={`w-6 h-6 mb-1 ${activeBaseView === item.view ? 'fill-primary/20' : ''}`} />
                            <span className="text-[10px] font-black">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </footer>
        </div>
    );
};

// --- PATIENT VIEWS / SCREENS ---

const EntityCard: React.FC<{
    item: (Doctor | BeautyCenter | Laboratory) & { distance?: number | null };
    onClick: () => void;
}> = ({ item, onClick }) => {
    const getSubtitle = () => {
        if ('specialty' in item) return (item as Doctor).specialty;
        return item.location;
    };

    return (
        <div 
            onClick={onClick} 
            className="relative flex-shrink-0 w-52 h-64 snap-center cursor-pointer transition-transform active:scale-95 touch-pan-x"
        >
            <div className="relative w-full h-full flex flex-col justify-end p-4">
                <img src={item.profilePicture} alt={item.name} className="absolute inset-x-0 top-4 mx-auto w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl z-10 border-4 border-white dark:border-gray-800" />
                <div className="bg-white dark:bg-surface rounded-[2rem] p-3 pt-20 text-center shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800">
                     <h4 className="font-black text-primary truncate">{item.name}</h4>
                     <p className="text-xs font-bold text-text-secondary truncate mt-1">{getSubtitle()}</p>
                     {item.distance !== null && typeof item.distance !== 'undefined' ? (
                        <div className="flex justify-center items-center gap-1 text-[10px] font-black text-accent mt-2 bg-accent/5 py-1 px-2 rounded-full w-max mx-auto">
                            <LocationIcon className="w-3 h-3" />
                            <span>{item.distance.toFixed(1)} كم</span>
                        </div>
                    ) : (
                        <div className="h-5 mt-2"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CategoryRow: React.FC<{
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    items: ((Doctor | BeautyCenter | Laboratory) & { distance?: number | null })[];
    onItemClick: (item: any) => void;
    onSeeAllClick: () => void;
    loading: boolean;
}> = ({ title, icon: Icon, items, onItemClick, onSeeAllClick, loading }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const isRtl = document.documentElement.dir === 'rtl';

    const checkScrollButtons = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const scrollableWidth = scrollWidth - clientWidth;
        if (scrollableWidth < 1) {
            setCanScrollPrev(false);
            setCanScrollNext(false);
            return;
        }
        if (isRtl) {
            const currentScroll = Math.abs(scrollLeft);
            setCanScrollPrev(currentScroll > 1);
            setCanScrollNext(currentScroll < scrollableWidth - 1);
        } else {
            setCanScrollPrev(scrollLeft > 1);
            setCanScrollNext(scrollLeft < scrollableWidth - 1);
        }
    }, [isRtl]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || loading || items.length === 0) return;
        const observer = new ResizeObserver(checkScrollButtons);
        observer.observe(container);
        const timeoutId = setTimeout(checkScrollButtons, 150);
        container.addEventListener('scroll', checkScrollButtons, { passive: true });
        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
            if (container) container.removeEventListener('scroll', checkScrollButtons);
        };
    }, [items, loading, checkScrollButtons]);

    
    return (
        <section className="fade-in">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/5 rounded-2xl">
                         <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-black text-primary tracking-tighter">{title}</h2>
                </div>
                <button onClick={onSeeAllClick} className="text-xs font-black text-accent hover:underline px-2 py-1 active:scale-95 transition-transform touch-manipulation">
                    عرض الكل
                </button>
            </div>
            {loading ? <LoadingSpinner size="h-10 w-10" /> : (
                <div className="relative">
                    {/* Added snap-x and scrollbar-hide for Native Carousel Feel */}
                    <div 
                        ref={scrollContainerRef} 
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 -mx-4 px-4 gap-1"
                    >
                        {items.length > 0 ? items.map((item) => (
                            <EntityCard key={item.id} item={item} onClick={() => onItemClick(item)} />
                        )) : <p className="text-xs text-text-secondary w-full text-center py-8 font-bold">لا توجد بيانات متاحة حالياً.</p>}
                    </div>
                </div>
            )}
        </section>
    );
};


const PatientHome: React.FC = () => {
    const { currentUser } = useAuthStore();
    const { navigate } = useUiStore();
    const [promotedDoctors, setPromotedDoctors] = useState<Doctor[]>([]);
    const [dentists, setDentists] = useState<Doctor[]>([]);
    const [beautyCenters, setBeautyCenters] = useState<BeautyCenter[]>([]);
    const [labs, setLabs] = useState<Laboratory[]>([]);
    const [loadingPromoted, setLoadingPromoted] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                (error) => console.error("Geolocation error:", error)
            );
        }
    }, []);

    useEffect(() => {
        setLoadingPromoted(true);
        api.getPromotedDoctors().then(res => res.json()).then(data => {
            setPromotedDoctors(data);
            setLoadingPromoted(false);
        });

        setLoadingCategories(true);
        Promise.all([api.getHomeDentists(), api.getHomeBeautyCenters(), api.getHomeLaboratories()])
            .then(async ([d, b, l]) => {
                setDentists(await d.json());
                setBeautyCenters(await b.json());
                setLabs(await l.json());
                setLoadingCategories(false);
            });
    }, []);
    
    const processWithDistance = useCallback((items: (Doctor | BeautyCenter | Laboratory)[]) => {
        if (!userLocation) return items.map(item => ({ ...item, distance: null }));
        return items.map(item => ({
            ...item,
            distance: getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng),
        }));
    }, [userLocation]);
    
    const processedPromotedDoctors = useMemo(() => processWithDistance(promotedDoctors), [promotedDoctors, processWithDistance]);
    const processedDentists = useMemo(() => processWithDistance(dentists), [dentists, processWithDistance]);
    const processedBeautyCenters = useMemo(() => processWithDistance(beautyCenters), [beautyCenters, processWithDistance]);
    const processedLabs = useMemo(() => processWithDistance(labs), [labs, processWithDistance]);

    return (
        <div className="p-6 space-y-10">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-primary tracking-tighter">مرحباً، {currentUser?.name?.split(' ')[0] || 'زائر'}!</h1>
                    <p className="text-sm font-bold text-text-secondary">كيف يمكننا مساعدتك اليوم؟</p>
                </div>
                 <button onClick={() => navigate(AppView.PatientProfile)} className="relative group touch-manipulation">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg group-hover:bg-primary/20 transition-all"></div>
                    <div className="relative w-14 h-14 bg-white dark:bg-surface rounded-2xl flex items-center justify-center border-2 border-gray-50 dark:border-gray-800 shadow-lg">
                         <UsersIcon className="w-7 h-7 text-primary"/>
                    </div>
                </button>
            </header>
            
            <div className="relative group">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <SearchIcon className="w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="ابحث عن طبيب، مركز أو مختبر..."
                    onFocus={() => navigate(AppView.PatientDoctorList)}
                    readOnly
                    className="w-full bg-white dark:bg-surface rounded-[1.5rem] py-5 px-6 pr-12 text-right cursor-pointer border-2 border-gray-50 dark:border-gray-800 shadow-xl shadow-primary/5 focus:border-primary transition-all outline-none font-bold text-sm touch-manipulation"
                />
            </div>

            <CategoryRow
                title="أطباء"
                icon={SparklesIcon}
                items={processedPromotedDoctors}
                onItemClick={(d) => navigate(AppView.PatientDoctorProfile, d)}
                onSeeAllClick={() => navigate(AppView.PatientDoctorList)}
                loading={loadingPromoted}
            />
            
            <CategoryRow
                title="أطباء الأسنان"
                icon={UsersIcon}
                items={processedDentists}
                onItemClick={(d) => navigate(AppView.PatientDoctorProfile, d)}
                onSeeAllClick={() => navigate(AppView.PatientDoctorList, { specialty: 'طب الأسنان' })}
                loading={loadingCategories}
            />

            <CategoryRow
                title="مراكز التجميل"
                icon={SparklesIcon}
                items={processedBeautyCenters}
                onItemClick={(c) => navigate(AppView.PatientBeautyCenterProfile, c)}
                onSeeAllClick={() => navigate(AppView.PatientBeautyCenterList)}
                loading={loadingCategories}
            />

            <CategoryRow
                title="المختبرات"
                icon={BeakerIcon}
                items={processedLabs}
                onItemClick={(l) => navigate(AppView.PatientLabProfile, l)}
                onSeeAllClick={() => navigate(AppView.PatientLabList)}
                loading={loadingCategories}
            />
        </div>
    );
};


const EntityMapView: React.FC<{ items: (Doctor[] | BeautyCenter[] | Laboratory[]); entityType: 'doctor' | 'beauty' | 'lab' }> = ({ items, entityType }) => {
    const { navigate } = useUiStore();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        
        // Ensure map isn't already initialized
        if (mapInstanceRef.current === null) {
            const map = L.map(mapContainerRef.current).setView([33.3152, 44.3661], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            mapInstanceRef.current = map;
        }

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update Markers
    useEffect(() => {
        if (mapInstanceRef.current) {
            const map = mapInstanceRef.current;
            
            // Clear existing markers
            map.eachLayer((layer: any) => { 
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            if (items.length > 0) {
                const markers = L.featureGroup();
                items.forEach(item => {
                    const marker = L.marker([item.lat, item.lng]).addTo(map);
                    // Mobile-friendly popup
                    marker.bindPopup(`<div style="font-family: 'Tajawal', sans-serif; text-align: right; direction: rtl; min-width: 150px;"><h3 style="font-weight: 900; color: #003366; font-size: 16px; margin-bottom: 4px;">${item.name}</h3><button id="view-profile-${item.id}" style="background-color: #003366; color: white; border-radius: 8px; padding: 6px 12px; font-size: 12px; border: none; width: 100%; cursor: pointer;">عرض الملف</button></div>`);
                    markers.addLayer(marker);
                    marker.on('popupopen', () => {
                        const btn = document.getElementById(`view-profile-${item.id}`);
                        if(btn) {
                            btn.onclick = () => navigate(entityType === 'doctor' ? AppView.PatientDoctorProfile : entityType === 'beauty' ? AppView.PatientBeautyCenterProfile : AppView.PatientLabProfile, item);
                            btn.ontouchstart = (e) => {
                                e.preventDefault(); // Prevent double-tap issues on map
                                navigate(entityType === 'doctor' ? AppView.PatientDoctorProfile : entityType === 'beauty' ? AppView.PatientBeautyCenterProfile : AppView.PatientLabProfile, item);
                            };
                        }
                    });
                });
                
                // Fit bounds
                try {
                    if (items.length > 1) {
                         map.fitBounds(markers.getBounds().pad(0.1)); 
                    } else if (items.length === 1) {
                        map.setView([items[0].lat, items[0].lng], 14);
                    }
                } catch(e) {
                    // Handle potential bounds errors
                }
            }
        }
    }, [items, navigate, entityType]);

    return <div ref={mapContainerRef} className="h-[calc(100vh-250px)] w-full rounded-[2rem] shadow-xl touch-pan-y" />;
};


const PatientDoctorList: React.FC = () => {
    const { navigate } = useUiStore();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [governorateFilter, setGovernorateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [governorates, setGovernorates] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [sortBy, setSortBy] = useState<'default' | 'distance'>('default');

    useEffect(() => {
        api.getSpecialties().then(r => r.json()).then(setSpecialties);
        api.getGovernorates().then(r => r.json()).then(setGovernorates);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }));
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        api.searchDoctors(searchQuery, specialtyFilter, governorateFilter).then(r => r.json()).then(data => {
            setDoctors(data);
            setLoading(false);
        });
    }, [searchQuery, specialtyFilter, governorateFilter]);

    const processedDoctors = useMemo(() => {
        const withDist = doctors.map(d => ({ ...d, distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, d.lat, d.lng) : null }));
        return sortBy === 'distance' ? [...withDist].sort((a,b) => (a.distance || 9999) - (b.distance || 9999)) : withDist;
    }, [doctors, userLocation, sortBy]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-black text-primary tracking-tighter">قائمة الأطباء</h1>
            <div className="space-y-3">
                <div className="relative"><input type="text" placeholder="ابحث بالاسم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-surface rounded-2xl py-4 px-10 text-right border-2 border-gray-50 dark:border-gray-800 shadow-lg font-bold" /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" /></div>
                <div className="grid grid-cols-2 gap-2">
                    <select value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)} className="w-full bg-white dark:bg-surface rounded-xl p-3 text-xs font-black border-2 border-gray-50 dark:border-gray-800"><option value="">كل التخصصات</option>{specialties.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <select value={governorateFilter} onChange={e => setGovernorateFilter(e.target.value)} className="w-full bg-white dark:bg-surface rounded-xl p-3 text-xs font-black border-2 border-gray-50 dark:border-gray-800"><option value="">كل المحافظات</option>{governorates.map(g => <option key={g} value={g}>{g}</option>)}</select>
                </div>
            </div>
            <div className="flex gap-2 p-1 bg-gray-50 dark:bg-surface rounded-2xl">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all touch-manipulation ${viewMode === 'list' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>قائمة</button>
                <button onClick={() => setViewMode('map')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all touch-manipulation ${viewMode === 'map' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>خريطة</button>
                <button onClick={() => setSortBy(sortBy === 'default' ? 'distance' : 'default')} disabled={!userLocation} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all touch-manipulation ${sortBy === 'distance' ? 'bg-accent/10 text-accent' : 'text-text-secondary opacity-50'}`}>{sortBy === 'distance' ? 'الأقرب أولاً' : 'فرز حسب القرب'}</button>
            </div>
            {loading ? <LoadingSpinner size="h-10 w-10" /> : viewMode === 'list' ? (
                <div className="space-y-4">{processedDoctors.map(doctor => (
                    <div key={doctor.id} onClick={() => navigate(AppView.PatientDoctorProfile, doctor)} className="flex items-center p-4 bg-white dark:bg-surface rounded-[2rem] shadow-xl shadow-primary/5 cursor-pointer border border-gray-50 dark:border-gray-800 hover:scale-[1.02] transition-transform active:scale-95 touch-manipulation">
                        <img src={doctor.profilePicture} alt={doctor.name} className="w-16 h-16 rounded-[1.2rem] object-cover ml-4 shadow-lg" />
                        <div className="flex-1"><h3 className="font-black text-primary text-sm">{doctor.name}</h3><p className="text-xs font-bold text-text-secondary">{doctor.specialty}</p><div className="flex items-center mt-2 bg-yellow-400/10 w-max px-2 py-0.5 rounded-full"><StarIcon className="w-3 h-3 text-yellow-500 ml-1" /><span className="text-[10px] font-black text-yellow-600">{doctor.rating}</span></div></div>
                        {doctor.distance && <div className="text-[10px] font-black text-accent">{doctor.distance.toFixed(1)} كم</div>}
                    </div>
                ))}</div>
            ) : <EntityMapView items={doctors} entityType="doctor" />}
        </div>
    );
};

const EntityGallery: React.FC<{ gallery: GalleryImage[] }> = ({ gallery }) => {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    if (!gallery || gallery.length === 0) return null;
    return (
        <>
        <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800">
            <h2 className="text-lg font-black text-primary mb-4">معرض الصور</h2>
            <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide pb-2">
                {gallery.map(image => (
                    <div key={image.id} className="flex-shrink-0 w-52 snap-center cursor-pointer group" onClick={() => setSelectedImage(image)}>
                        <div className="relative overflow-hidden rounded-[1.5rem] shadow-lg">
                            <img src={image.imageUrl} alt={image.description} className="w-full h-36 object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <p className="text-[10px] font-bold text-text-secondary mt-2 text-center">{image.description}</p>
                    </div>
                ))}
            </div>
        </div>
        {selectedImage && (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setSelectedImage(null)}>
                <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                    <img src={selectedImage.imageUrl} alt={selectedImage.description} className="w-full h-auto max-h-[70vh] object-contain rounded-[2rem] shadow-2xl" />
                    <p className="text-white font-bold text-center mt-6 text-lg">{selectedImage.description}</p>
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-10 left-1/2 -translate-x-1/2 text-white/50 text-xs font-black uppercase tracking-widest p-4 touch-manipulation">إغلاق المعاينة</button>
                </div>
            </div>
        )}
        </>
    );
};

const BookingScheduler: React.FC<{
    entityId: string;
    entityType: 'doctor' | 'beauty_center' | 'laboratory';
    durationInMinutes: number;
    service?: BeautyService;
    test?: LabTest;
    offer?: OfferPackage;
}> = ({ entityId, entityType, durationInMinutes, service, test, offer }) => {
    const { navigate } = useUiStore();
    const { currentUser, isAuthenticated } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState<Date[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [patientNotes, setPatientNotes] = useState('');

    useEffect(() => {
        setLoadingSlots(true);
        api.getAvailableTimeSlots(entityId, entityType, selectedDate, durationInMinutes)
            .then(r => r.json()).then(slots => {
                setTimeSlots(slots.map((s:string) => new Date(s)));
                setLoadingSlots(false);
            });
    }, [entityId, entityType, selectedDate, durationInMinutes]);

    const handleBooking = async () => {
        if (!selectedSlot) return alert("الرجاء اختيار وقت.");
        if (!isAuthenticated) { alert("يرجى تسجيل الدخول أولاً."); return navigate(AppView.Login); }
        const details = { patientId: currentUser!.id, patientName: currentUser!.name, startTime: selectedSlot, patientNotes };
        let res;
        if (entityType === 'doctor') res = await api.bookAppointment({ doctorId: entityId, ...details });
        else if (entityType === 'beauty_center') res = await api.bookBeautyService({ centerId: entityId, service, offer, ...details });
        else res = await api.bookLabTest({ labId: entityId, test, offer, ...details });

        if (res.ok) navigate(entityType === 'doctor' ? AppView.PatientBookingConfirmation : entityType === 'beauty_center' ? AppView.PatientBeautyBookingConfirmation : AppView.PatientLabBookingConfirmation);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-background p-3 rounded-2xl">
                <button onClick={() => {const d = new Date(selectedDate); d.setDate(d.getDate()-1); if(d >= new Date(new Date().toDateString())) setSelectedDate(d);}} className="p-3 touch-manipulation"><ChevronRightIcon className="w-5 h-5 text-primary" /></button>
                <span className="font-black text-primary text-sm">{selectedDate.toLocaleDateString('ar-IQ', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <button onClick={() => {const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d);}} className="p-3 touch-manipulation"><ChevronLeftIcon className="w-5 h-5 text-primary" /></button>
            </div>
            {loadingSlots ? <LoadingSpinner size="h-8 w-8" /> : (
                <div className="grid grid-cols-3 gap-2">
                    {timeSlots.length > 0 ? timeSlots.map(slot => (
                        <button key={slot.toISOString()} onClick={() => setSelectedSlot(slot)} className={`p-3 rounded-xl text-xs font-black transition-all touch-manipulation ${selectedSlot?.getTime() === slot.getTime() ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white dark:bg-background text-text-secondary border border-gray-100 dark:border-gray-800'}`}>
                            {slot.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </button>
                    )) : <p className="col-span-3 text-center text-xs font-bold text-text-secondary py-4 opacity-50">لا توجد مواعيد متاحة</p>}
                </div>
            )}
            <textarea value={patientNotes} onChange={e => setPatientNotes(e.target.value)} rows={3} placeholder="هل لديك أي ملاحظات للطبيب؟" className="w-full p-4 text-xs font-bold bg-white dark:bg-background border-2 border-gray-50 dark:border-gray-800 rounded-2xl outline-none focus:border-primary transition-colors" />
            <button onClick={handleBooking} disabled={!selectedSlot} className="w-full py-5 font-black text-white bg-primary rounded-[1.5rem] shadow-xl shadow-primary/20 disabled:opacity-30 transition-transform active:scale-95 touch-manipulation">تأكيد الحجز الآن</button>
        </div>
    );
};


const PatientDoctorProfile: React.FC = () => {
    const { selectedDoctor, navigate } = useUiStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    useEffect(() => { if (selectedDoctor) api.fetchDoctorReviews(selectedDoctor.id).then(r => r.json()).then(setReviews); }, [selectedDoctor]);
    if (!selectedDoctor) return null;
    return (
        <div className="fade-in">
            <header className="relative h-48 bg-primary/10 rounded-b-[3rem]">
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2"><img src={selectedDoctor.profilePicture} alt={selectedDoctor.name} className="w-36 h-36 rounded-[2.5rem] object-cover border-4 border-white dark:border-gray-900 shadow-2xl z-20"/></div>
            </header>
            <div className="pt-20 p-6 text-center space-y-2">
                <h1 className="text-2xl font-black text-primary tracking-tighter">{selectedDoctor.name}</h1>
                <p className="text-sm font-bold text-text-secondary">{selectedDoctor.specialty}</p>
                <div className="flex justify-center items-center gap-1 bg-yellow-400/10 w-max mx-auto px-3 py-1 rounded-full"><StarIcon className="w-4 h-4 text-yellow-500"/><span className="text-xs font-black text-yellow-600">{selectedDoctor.rating} (١٢٠ تقييم)</span></div>
            </div>
            <div className="p-6 space-y-8">
                <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800"><h2 className="text-lg font-black text-primary mb-3">نبذة تعريفية</h2><p className="text-xs font-bold text-text-secondary leading-relaxed">{selectedDoctor.bio}</p></div>
                <EntityGallery gallery={selectedDoctor.gallery} />
                 <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800">
                    <h2 className="text-lg font-black text-primary mb-4">احجز موعدك</h2>
                     <BookingScheduler entityId={selectedDoctor.id} entityType="doctor" durationInMinutes={selectedDoctor.schedule.appointmentDurationMinutes} />
                </div>
            </div>
        </div>
    );
};

const PatientBookingConfirmation: React.FC<{ isBeauty?: boolean; isLab?: boolean }> = ({ isBeauty, isLab }) => {
    const { navigate } = useUiStore();
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-10 fade-in">
            <div className="w-32 h-32 bg-success/10 rounded-[3rem] flex items-center justify-center mb-8 relative">
                 <div className="absolute inset-0 bg-success/5 rounded-full animate-ping"></div>
                 <svg className="w-16 h-16 text-success relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter">تم الحجز بنجاح!</h1>
            <p className="text-sm font-bold text-text-secondary mt-4 leading-relaxed">شكراً لثقتك بنا. تم تسجيل حجزك وسيصلك إشعار تأكيد قريباً.</p>
            <div className="mt-12 space-y-4 w-full">
                <button onClick={() => navigate(AppView.PatientAppointments)} className="w-full py-5 font-black text-white bg-primary rounded-[2rem] shadow-xl shadow-primary/20 transition-transform active:scale-95 touch-manipulation">عرض مواعيدي</button>
                <button onClick={() => navigate(AppView.PatientHome)} className="w-full py-5 font-black text-primary bg-white border-2 border-primary/10 rounded-[2rem] hover:bg-primary/5 transition-all touch-manipulation">العودة للرئيسية</button>
            </div>
        </div>
    );
};

const PatientBookingDetailsModal: React.FC<{ booking: PatientBooking; onClose: () => void }> = ({ booking, onClose }) => {
    const getEntityName = () => {
        if (booking.type === 'doctor') return booking.doctorNotes;
        if (booking.type === 'beauty') return (booking as BeautyBooking).centerNotes;
        return (booking as LabBooking).labNotes;
    };
    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6" onClick={onClose}>
            <div className="bg-white dark:bg-surface rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-4"><ClockIcon className="w-10 h-10 text-primary" /></div>
                    <h2 className="text-2xl font-black text-primary tracking-tighter">تفاصيل الحجز</h2>
                    <div className="space-y-3 py-4 border-y border-gray-50 dark:border-gray-800">
                        <div className="flex justify-between"><span className="text-xs font-bold text-text-secondary">المزود</span><span className="text-xs font-black text-primary">{getEntityName() || 'غير متوفر'}</span></div>
                        <div className="flex justify-between"><span className="text-xs font-bold text-text-secondary">التاريخ</span><span className="text-xs font-black text-primary">{new Date(booking.startTime).toLocaleDateString('ar-IQ')}</span></div>
                        <div className="flex justify-between"><span className="text-xs font-bold text-text-secondary">الوقت</span><span className="text-xs font-black text-primary">{new Date(booking.startTime).toLocaleTimeString('ar-IQ', {timeStyle: 'short'})}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-text-secondary">الحالة</span><span className="px-3 py-1 text-[10px] font-black rounded-full bg-success/10 text-success uppercase tracking-widest">{booking.status}</span></div>
                    </div>
                    <button onClick={onClose} className="w-full py-4 font-black text-white bg-primary rounded-2xl shadow-lg shadow-primary/10 mt-4 transition-transform active:scale-95 touch-manipulation">فهمت، شكراً</button>
                </div>
            </div>
        </div>
    );
};

const PatientAppointments: React.FC = () => {
    const { currentUser, isAuthenticated } = useAuthStore();
    const { navigate } = useUiStore();
    const [bookings, setBookings] = useState<PatientBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);

    useEffect(() => { if(isAuthenticated && currentUser) api.getPatientAppointments(currentUser.id).then(r => r.json()).then(data => { setBookings(data); setLoading(false); }); else setLoading(false); }, [isAuthenticated, currentUser]);

    if (!isAuthenticated) return (
        <div className="p-10 text-center flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center opacity-30"><ClockIcon className="w-12 h-12" /></div>
            <h1 className="text-2xl font-black text-primary tracking-tighter">سجل الدخول للمتابعة</h1>
            <p className="text-xs font-bold text-text-secondary px-6">يرجى تسجيل الدخول لتتمكن من عرض وإدارة مواعيدك الطبية.</p>
            <button onClick={() => navigate(AppView.Login)} className="w-full py-5 font-black text-white bg-primary rounded-[2rem] shadow-xl shadow-primary/20 touch-manipulation">تسجيل الدخول</button>
        </div>
    );

    const now = new Date();
    const list = bookings.filter(b => activeTab === 'upcoming' ? (new Date(b.startTime) >= now && b.status === 'scheduled') : (new Date(b.startTime) < now || b.status !== 'scheduled'));

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-black text-primary tracking-tighter">مواعيدي</h1>
            <div className="flex p-1 bg-gray-50 dark:bg-surface rounded-2xl">
                <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all touch-manipulation ${activeTab === 'upcoming' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>القادمة</button>
                <button onClick={() => setActiveTab('past')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all touch-manipulation ${activeTab === 'past' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>السابقة</button>
            </div>
            {loading ? <LoadingSpinner size="h-10 w-10" /> : (
                <div className="space-y-4">{list.map(b => (
                    <div key={b.id} onClick={() => setSelectedBooking(b)} className="p-5 bg-white dark:bg-surface rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 cursor-pointer transition-transform active:scale-95 touch-manipulation">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${b.type === 'doctor' ? 'bg-primary/5 text-primary' : b.type === 'beauty' ? 'bg-accent/5 text-accent' : 'bg-teal-500/5 text-teal-600'}`}>{b.type === 'doctor' ? <UsersIcon className="w-6 h-6" /> : b.type === 'beauty' ? <SparklesIcon className="w-6 h-6" /> : <BeakerIcon className="w-6 h-6" />}</div>
                            <div className="flex-1 space-y-1"><p className="text-sm font-black text-primary">{b.type === 'doctor' ? 'موعد طبي' : b.type === 'beauty' ? 'جلسة تجميل' : 'فحص مختبري'}</p><p className="text-[10px] font-bold text-text-secondary">{new Date(b.startTime).toLocaleString('ar-IQ', {dateStyle: 'long', timeStyle: 'short'})}</p></div>
                            <span className={`px-3 py-1 text-[10px] font-black rounded-full ${b.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-text-secondary opacity-50'}`}>{b.status === 'scheduled' ? 'نشط' : 'انتهى'}</span>
                        </div>
                    </div>
                ))}
                {list.length === 0 && <div className="text-center py-20 opacity-20"><ClockIcon className="w-16 h-16 mx-auto mb-2" /><p className="font-black text-xs">لا توجد مواعيد</p></div>}
                </div>
            )}
            {selectedBooking && <PatientBookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        </div>
    );
};

const PatientProfile: React.FC = () => {
    const { currentUser, logout, isAuthenticated } = useAuthStore();
    const { navigate } = useUiStore();

    if (!isAuthenticated || !currentUser) {
        return (
            <div className="p-10 text-center flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-24 h-24 bg-gray-50 dark:bg-surface rounded-[2.5rem] flex items-center justify-center opacity-30">
                    <UsersIcon className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-primary tracking-tighter">سجل الدخول للمتابعة</h1>
                <p className="text-xs font-bold text-text-secondary px-6">يرجى تسجيل الدخول لعرض ملفك الشخصي وإدارته.</p>
                <button onClick={() => navigate(AppView.Login)} className="w-full py-5 font-black text-white bg-primary rounded-[2rem] shadow-xl shadow-primary/20 transition-transform active:scale-95 touch-manipulation">تسجيل الدخول</button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-black text-primary tracking-tighter">ملفي الشخصي</h1>
            <div className="p-8 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 space-y-6">
                <div className="flex flex-col items-center pb-6 border-b border-gray-50 dark:border-gray-800">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-4 shadow-inner">
                        <UsersIcon className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-xl font-black text-primary">{currentUser.name}</h2>
                    <p className="text-xs font-bold text-text-secondary">{currentUser.phoneNumber}</p>
                </div>
                <div className="space-y-4">
                    <button onClick={() => navigate(AppView.PatientMedicalRecord)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-background rounded-2xl hover:bg-primary/5 transition-all active:scale-95 touch-manipulation">
                        <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-primary" />
                            <span className="text-xs font-black text-primary">سجلي الطبي</span>
                        </div>
                        <ChevronLeftIcon className="w-4 h-4 text-primary opacity-30" />
                    </button>
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-5 font-black text-error bg-error/5 rounded-2xl transition-transform active:scale-95 hover:bg-error/10 touch-manipulation">
                        <LogoutIcon className="w-5 h-5" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const PatientMedicalRecordView: React.FC = () => {
    const { currentUser, isAuthenticated } = useAuthStore();
    const { navigate } = useUiStore();
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<MedicalRecord>>({});
    
    useEffect(() => { if (isAuthenticated && currentUser) { setIsLoading(true); api.getMedicalRecord(currentUser.id).then(r => r.json()).then(d => { setRecord(d); setFormData(d || {}); setIsLoading(false); }); } }, [currentUser, isAuthenticated]);

    const handleSave = async () => { if (!currentUser) return; setIsLoading(true); const res = await api.updateMedicalRecord(currentUser.id, formData as MedicalRecord); if (res.ok) { setRecord(await res.json()); setIsEditing(false); } setIsLoading(false); };

    if (isLoading) return <LoadingSpinner />;

    const Field = ({title, val, keyName, isArray}: any) => (
        <div className="space-y-2 border-b border-gray-50 dark:border-gray-800 pb-4">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{title}</label>
            {isEditing ? (
                isArray ? <textarea rows={2} value={(formData[keyName as keyof MedicalRecord] as any || []).join('\n')} onChange={e => setFormData({...formData, [keyName]: e.target.value.split('\n').filter(Boolean)})} className="w-full p-3 bg-gray-50 dark:bg-background rounded-xl text-xs font-bold" /> :
                <input value={formData[keyName as keyof MedicalRecord] as any || ''} onChange={e => setFormData({...formData, [keyName]: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-background rounded-xl text-xs font-bold" />
            ) : <p className="text-sm font-black text-primary">{isArray ? (val?.length ? val.join('، ') : 'لا يوجد') : (val || 'لا يوجد')}</p>}
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-end">
                <h1 className="text-2xl font-black text-primary tracking-tighter">السجل الطبي</h1>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`px-6 py-2 rounded-full font-black text-xs shadow-lg transition-all active:scale-95 touch-manipulation ${isEditing ? 'bg-success text-white' : 'bg-primary text-white'}`}>
                    {isEditing ? 'حفظ التغييرات' : 'تعديل السجل'}
                </button>
            </div>
            <div className="p-8 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <Field title="العمر" val={record?.age} keyName="age" />
                    <Field title="فصيلة الدم" val={record?.bloodType} keyName="bloodType" />
                    <Field title="الطول" val={record?.height} keyName="height" />
                    <Field title="الوزن" val={record?.weight} keyName="weight" />
                </div>
                <Field title="الحساسية" val={record?.allergies} keyName="allergies" isArray />
                <Field title="الأدوية الحالية" val={record?.medications} keyName="medications" isArray />
            </div>
            {isEditing && <button onClick={() => setIsEditing(false)} className="w-full py-4 text-xs font-black text-text-secondary hover:text-error transition-colors touch-manipulation">إلغاء التعديل</button>}
        </div>
    );
};

const PatientBeautyCenterList: React.FC = () => {
    const { navigate } = useUiStore();
    const [centers, setCenters] = useState<BeautyCenter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [governorateFilter, setGovernorateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [governorates, setGovernorates] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        api.getGovernorates().then(r => r.json()).then(setGovernorates);
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }));
    }, []);

    useEffect(() => {
        setLoading(true);
        api.searchBeautyCenters(searchQuery, governorateFilter).then(r => r.json()).then(data => { setCenters(data); setLoading(false); });
    }, [searchQuery, governorateFilter]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-black text-primary tracking-tighter">مراكز التجميل</h1>
            <div className="space-y-3">
                <div className="relative"><input type="text" placeholder="ابحث عن مركز..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-surface rounded-2xl py-4 px-10 font-bold border-2 border-gray-50 dark:border-gray-800" /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" /></div>
                <select value={governorateFilter} onChange={e => setGovernorateFilter(e.target.value)} className="w-full bg-white dark:bg-surface rounded-xl p-3 text-xs font-black border-2 border-gray-50 dark:border-gray-800"><option value="">كل المحافظات</option>{governorates.map(g => <option key={g} value={g}>{g}</option>)}</select>
            </div>
            <div className="flex gap-2 p-1 bg-gray-50 dark:bg-surface rounded-2xl">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-3 rounded-xl font-black text-xs ${viewMode === 'list' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>قائمة</button>
                <button onClick={() => setViewMode('map')} className={`flex-1 py-3 rounded-xl font-black text-xs ${viewMode === 'map' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>خريطة</button>
            </div>
            {loading ? <LoadingSpinner size="h-10 w-10" /> : viewMode === 'list' ? (
                <div className="space-y-4">{centers.map(center => (
                    <div key={center.id} onClick={() => navigate(AppView.PatientBeautyCenterProfile, center)} className="flex items-center p-4 bg-white dark:bg-surface rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 hover:scale-[1.02] transition-transform active:scale-95 touch-manipulation">
                        <img src={center.profilePicture} alt={center.name} className="w-16 h-16 rounded-[1.2rem] object-cover ml-4 shadow-lg" />
                        <div className="flex-1"><h3 className="font-black text-primary text-sm">{center.name}</h3><p className="text-[10px] font-bold text-text-secondary">{center.location}</p></div>
                        <SparklesIcon className="w-5 h-5 text-accent opacity-20" />
                    </div>
                ))}</div>
            ) : <EntityMapView items={centers as any} entityType="beauty" />}
        </div>
    );
};

const PatientBeautyCenterProfile: React.FC = () => {
    const { selectedBeautyCenter, navigate } = useUiStore();
    const [activeTab, setActiveTab] = useState<'services' | 'offers'>('services');
    const [selectedItem, setSelectedItem] = useState<{ type: 'service' | 'offer', item: BeautyService | OfferPackage } | null>(null);
    if (!selectedBeautyCenter) return null;
    return (
        <div className="fade-in">
            <header className="relative h-48 bg-accent/5 rounded-b-[3rem]">
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2"><img src={selectedBeautyCenter.profilePicture} alt={selectedBeautyCenter.name} className="w-36 h-36 rounded-[2.5rem] object-cover border-4 border-white dark:border-gray-900 shadow-2xl z-20"/></div>
            </header>
            <div className="pt-20 p-6 text-center space-y-1">
                <h1 className="text-2xl font-black text-primary tracking-tighter">{selectedBeautyCenter.name}</h1>
                <p className="text-sm font-bold text-text-secondary">{selectedBeautyCenter.location}</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800"><h2 className="text-lg font-black text-primary mb-3">عن المركز</h2><p className="text-xs font-bold text-text-secondary leading-relaxed">{selectedBeautyCenter.bio}</p></div>
                <EntityGallery gallery={selectedBeautyCenter.gallery} />
                <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800">
                    <div className="flex border-b border-gray-50 dark:border-gray-800 mb-6"><button onClick={() => setActiveTab('services')} className={`flex-1 pb-4 text-xs font-black transition-all ${activeTab === 'services' ? 'text-accent border-b-4 border-accent' : 'text-text-secondary opacity-40'}`}>الخدمات</button><button onClick={() => setActiveTab('offers')} className={`flex-1 pb-4 text-xs font-black transition-all ${activeTab === 'offers' ? 'text-accent border-b-4 border-accent' : 'text-text-secondary opacity-40'}`}>العروض المميزة</button></div>
                    <div className="space-y-4">
                        {activeTab === 'services' ? selectedBeautyCenter.services.map(s => (
                            <div key={s.id} onClick={() => setSelectedItem({ type: 'service', item: s })} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-background rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 touch-manipulation"><div className="space-y-1"><h4 className="text-xs font-black text-primary">{s.name}</h4><p className="text-[10px] font-bold text-text-secondary">{s.duration} دقيقة</p></div><span className="text-xs font-black text-accent">{s.price.toLocaleString('ar-IQ')} د.ع</span></div>
                        )) : selectedBeautyCenter.offers.map(o => (
                            <div key={o.id} onClick={() => setSelectedItem({ type: 'offer', item: o })} className="p-4 bg-accent/5 rounded-2xl border-2 border-accent/10 cursor-pointer relative overflow-hidden touch-manipulation"><div className="relative z-10"><h4 className="text-xs font-black text-accent">{o.name}</h4><p className="text-[10px] font-bold text-text-secondary mt-1">{o.description}</p><div className="flex justify-between items-end mt-3"><span className="text-sm font-black text-accent">{o.price.toLocaleString('ar-IQ')} د.ع</span><span className="text-[10px] font-bold text-text-secondary line-through opacity-50">{o.originalPrice.toLocaleString('ar-IQ')} د.ع</span></div></div><div className="absolute top-0 left-0 p-2 opacity-10"><TagIcon className="w-12 h-12 text-accent rotate-12" /></div></div>
                        ))}
                    </div>
                </div>
                {selectedItem && <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 animate-slide-up"><div className="flex justify-between items-start mb-6"><div><h2 className="text-lg font-black text-primary">حجز الموعد</h2><p className="text-xs font-bold text-text-secondary">{selectedItem.item.name}</p></div><button onClick={() => setSelectedItem(null)} className="text-xs font-black text-accent">إلغاء</button></div><BookingScheduler entityId={selectedBeautyCenter.id} entityType="beauty_center" durationInMinutes={selectedItem.item.duration} service={selectedItem.type === 'service' ? selectedItem.item as BeautyService : undefined} offer={selectedItem.type === 'offer' ? selectedItem.item as OfferPackage : undefined} /></div>}
            </div>
        </div>
    );
};

const PatientLabList: React.FC = () => {
    const { navigate } = useUiStore();
    const [labs, setLabs] = useState<Laboratory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [governorateFilter, setGovernorateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [governorates, setGovernorates] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    useEffect(() => {
        api.getGovernorates().then(r => r.json()).then(setGovernorates);
        api.searchLaboratories('', '').then(r => r.json()).then(setLabs);
    }, []);

    useEffect(() => {
        setLoading(true);
        api.searchLaboratories(searchQuery, governorateFilter).then(r => r.json()).then(data => { setLabs(data); setLoading(false); });
    }, [searchQuery, governorateFilter]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-black text-primary tracking-tighter">المختبرات الطبية</h1>
            <div className="space-y-3">
                <div className="relative"><input type="text" placeholder="ابحث عن مختبر..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-surface rounded-2xl py-4 px-10 font-bold border-2 border-gray-50 dark:border-gray-800" /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" /></div>
                <select value={governorateFilter} onChange={e => setGovernorateFilter(e.target.value)} className="w-full bg-white dark:bg-surface rounded-xl p-3 text-xs font-black border-2 border-gray-50 dark:border-gray-800"><option value="">كل المحافظات</option>{governorates.map(g => <option key={g} value={g}>{g}</option>)}</select>
            </div>
            <div className="flex gap-2 p-1 bg-gray-50 dark:bg-surface rounded-2xl">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-3 rounded-xl font-black text-xs ${viewMode === 'list' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>قائمة</button>
                <button onClick={() => setViewMode('map')} className={`flex-1 py-3 rounded-xl font-black text-xs ${viewMode === 'map' ? 'bg-white dark:bg-background text-primary shadow-md' : 'text-text-secondary opacity-50'}`}>خريطة</button>
            </div>
            {loading ? <LoadingSpinner size="h-10 w-10" /> : viewMode === 'list' ? (
                <div className="space-y-4">{labs.map(lab => (
                    <div key={lab.id} onClick={() => navigate(AppView.PatientLabProfile, lab)} className="flex items-center p-4 bg-white dark:bg-surface rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 hover:scale-[1.02] transition-transform active:scale-95 touch-manipulation">
                        <img src={lab.profilePicture} alt={lab.name} className="w-16 h-16 rounded-[1.2rem] object-cover ml-4 shadow-lg" />
                        <div className="flex-1"><h3 className="font-black text-primary text-sm">{lab.name}</h3><p className="text-[10px] font-bold text-text-secondary">{lab.location}</p></div>
                        <BeakerIcon className="w-5 h-5 text-teal-600 opacity-20" />
                    </div>
                ))}</div>
            ) : <EntityMapView items={labs as any} entityType="lab" />}
        </div>
    );
};

const PatientLabProfile: React.FC = () => {
    const { selectedLab, navigate } = useUiStore();
    const [activeTab, setActiveTab] = useState<'tests' | 'offers'>('tests');
    const [selectedItem, setSelectedItem] = useState<{ type: 'test' | 'offer', item: LabTest | OfferPackage } | null>(null);
    if (!selectedLab) return null;
    return (
        <div className="fade-in">
            <header className="relative h-48 bg-primary/5 rounded-b-[3rem]">
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2"><img src={selectedLab.profilePicture} alt={selectedLab.name} className="w-36 h-36 rounded-[2.5rem] object-cover border-4 border-white dark:border-gray-900 shadow-2xl z-20"/></div>
            </header>
            <div className="pt-20 p-6 text-center space-y-1">
                <h1 className="text-2xl font-black text-primary tracking-tighter">{selectedLab.name}</h1>
                <p className="text-sm font-bold text-text-secondary">{selectedLab.location}</p>
            </div>
            <div className="p-6 space-y-8">
                <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800"><h2 className="text-lg font-black text-primary mb-3">عن المختبر</h2><p className="text-xs font-bold text-text-secondary leading-relaxed">{selectedLab.bio}</p></div>
                <EntityGallery gallery={selectedLab.gallery} />
                <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800">
                    <div className="flex border-b border-gray-50 dark:border-gray-800 mb-6"><button onClick={() => setActiveTab('tests')} className={`flex-1 pb-4 text-xs font-black transition-all ${activeTab === 'tests' ? 'text-primary border-b-4 border-primary' : 'text-text-secondary opacity-40'}`}>الفحوصات</button><button onClick={() => setActiveTab('offers')} className={`flex-1 pb-4 text-xs font-black transition-all ${activeTab === 'offers' ? 'text-primary border-b-4 border-primary' : 'text-text-secondary opacity-40'}`}>العروض</button></div>
                    <div className="space-y-4">
                        {activeTab === 'tests' ? selectedLab.tests.map(t => (
                            <div key={t.id} onClick={() => setSelectedItem({ type: 'test', item: t })} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-background rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 touch-manipulation"><div><h4 className="text-xs font-black text-primary">{t.name}</h4><p className="text-[10px] font-bold text-text-secondary">{t.duration} دقيقة</p></div><span className="text-xs font-black text-primary">{t.price.toLocaleString('ar-IQ')} د.ع</span></div>
                        )) : selectedLab.offers.map(o => (
                            <div key={o.id} onClick={() => setSelectedItem({ type: 'offer', item: o })} className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 cursor-pointer relative overflow-hidden touch-manipulation"><h4 className="text-xs font-black text-primary">{o.name}</h4><p className="text-[10px] font-bold text-text-secondary mt-1">{o.description}</p><div className="flex justify-between items-end mt-3"><span className="text-sm font-black text-primary">{o.price.toLocaleString('ar-IQ')} د.ع</span><span className="text-[10px] font-bold text-text-secondary line-through opacity-50">{o.originalPrice.toLocaleString('ar-IQ')} د.ع</span></div><div className="absolute top-0 left-0 p-2 opacity-10"><TagIcon className="w-12 h-12 text-primary rotate-12" /></div></div>
                        ))}
                    </div>
                </div>
                {selectedItem && <div className="p-6 bg-white dark:bg-surface rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-50 dark:border-gray-800 animate-slide-up"><div className="flex justify-between items-start mb-6"><div><h2 className="text-lg font-black text-primary">حجز الموعد</h2><p className="text-xs font-bold text-text-secondary">{selectedItem.item.name}</p></div><button onClick={() => setSelectedItem(null)} className="text-xs font-black text-accent">إلغاء</button></div><BookingScheduler entityId={selectedLab.id} entityType="laboratory" durationInMinutes={selectedItem.item.duration} test={selectedItem.type === 'test' ? selectedItem.item as LabTest : undefined} offer={selectedItem.type === 'offer' ? selectedItem.item as OfferPackage : undefined} /></div>}
            </div>
        </div>
    );
};
