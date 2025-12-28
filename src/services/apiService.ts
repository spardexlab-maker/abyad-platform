
import { User, Doctor, Appointment, Review, Notification, MedicalRecord, ReportData, ActivityLog, BeautyCenter, Laboratory, Admin, Patient, DoctorSchedule, BeautyService, LabTest, BeautyBooking, LabBooking, PatientBooking, GalleryImage, OfferPackage } from '../types';

// --- MOCK DATABASE STRUCTURE ---

interface MockDB {
  users: User[];
  doctors: Doctor[];
  beautyCenters: BeautyCenter[];
  laboratories: Laboratory[];
  appointments: Appointment[];
  beautyBookings: BeautyBooking[];
  labBookings: LabBooking[];
  reviews: Review[];
  notifications: Notification[];
  medicalRecords: MedicalRecord[];
  activityLogs: ActivityLog[];
}

let DB: MockDB = {
    users: [],
    doctors: [],
    beautyCenters: [],
    laboratories: [],
    appointments: [],
    beautyBookings: [],
    labBookings: [],
    reviews: [],
    notifications: [],
    medicalRecords: [],
    activityLogs: []
};

// --- HELPERS ---

const STORAGE_KEY = 'myDoctor_DB_v2'; // Changed key to force re-init with new seed data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const saveState = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    } catch (e) {
        console.error("Failed to save state", e);
    }
};

const loadState = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            DB = JSON.parse(stored);
        } else {
            initializeMockData();
        }
    } catch (e) {
        console.error("Failed to load state", e);
        initializeMockData();
    }
};

const initializeMockData = () => {
    // 1. Admin
    const admin: Admin = { id: 'admin1', name: 'System Admin', role: 'admin', email: 'admin@sys.com', password: '123', status: 'active' };
    
    // 2. Doctor
    const doctor: Doctor = {
        id: 'doc1',
        name: 'د. علي حسين',
        email: 'doctor@sys.com',
        password: '123',
        role: 'doctor',
        specialty: 'طب الأسنان',
        governorate: 'بغداد',
        location: 'المنصور، شارع 14 رمضان',
        lat: 33.3128,
        lng: 44.3615,
        experienceYears: 10,
        consultationFee: 25000,
        bio: 'طبيب أسنان متخصص في زراعة وتجميل الأسنان بخبرة تتجاوز 10 سنوات.',
        rating: 4.8,
        status: 'active',
        promoted: true,
        showOnHome: true,
        profilePicture: 'https://img.freepik.com/free-photo/portrait-smiling-handsome-male-doctor-man_171337-5055.jpg',
        appointments: [],
        gallery: [],
        schedule: {
            workDays: [0, 1, 2, 3, 4], // Sun-Thu
            startTime: '09:00',
            endTime: '17:00',
            appointmentDurationMinutes: 30,
            daysOff: []
        }
    };

    // 3. Beauty Center
    const center: BeautyCenter = {
        id: 'center1',
        name: 'مركز اللوتس للتجميل',
        email: 'center@sys.com',
        password: '123',
        role: 'beauty_center',
        governorate: 'بغداد',
        location: 'الكرادة، ساحة الواثق',
        lat: 33.3030,
        lng: 44.4230,
        bio: 'أحدث التقنيات في عالم التجميل والعناية بالبشرة.',
        status: 'active',
        showOnHome: true,
        profilePicture: 'https://img.freepik.com/free-photo/beauty-spa-salon-interior_1303-20752.jpg',
        bookings: [],
        gallery: [],
        offers: [],
        services: [
            { id: 's1', name: 'هيدرافيشل', price: 50000, duration: 60 },
            { id: 's2', name: 'ليزر جسم كامل', price: 150000, duration: 90 }
        ],
        schedule: {
            workDays: [0, 1, 2, 3, 4, 5, 6],
            startTime: '10:00',
            endTime: '20:00',
            appointmentDurationMinutes: 60
        }
    };

    // 4. Laboratory
    const lab: Laboratory = {
        id: 'lab1',
        name: 'مختبرات النخبة',
        email: 'lab@sys.com',
        password: '123',
        role: 'laboratory',
        governorate: 'بغداد',
        location: 'الحارثية، شارع الكندي',
        lat: 33.3250,
        lng: 44.3600,
        bio: 'دقة في النتائج وسرعة في الإنجاز.',
        status: 'active',
        showOnHome: true,
        profilePicture: 'https://img.freepik.com/free-photo/medical-banner-with-doctor-working-microscope_23-2149611238.jpg',
        bookings: [],
        gallery: [],
        offers: [],
        tests: [
            { id: 't1', name: 'صورة دم كاملة (CBC)', price: 15000, duration: 15 },
            { id: 't2', name: 'فيتامين D3', price: 35000, duration: 20 }
        ],
        schedule: {
            workDays: [0, 1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '22:00',
            appointmentDurationMinutes: 15
        }
    };

    // 5. Patient
    const patient: Patient = {
        id: 'pat1',
        name: 'أحمد محمد',
        email: 'patient@sys.com',
        password: '123',
        role: 'patient',
        phoneNumber: '07701234567',
        status: 'active'
    };

    DB.users.push(admin);
    DB.users.push(patient);
    DB.doctors.push(doctor);
    DB.beautyCenters.push(center);
    DB.laboratories.push(lab);
    
    saveState();
};

export const handleRequest = async <T>(callback: () => T): Promise<Response> => {
    await delay(300); // Simulate network latency
    try {
        const result = callback();
        saveState();
        return new Response(JSON.stringify(result), { status: 200, statusText: 'OK' });
    } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message || 'Error processing request' }), { status: 400, statusText: 'Bad Request' });
    }
};

// Ensure state is loaded
loadState();


// --- AUTHENTICATION ---

export const login = async (contactInfo: string, password: string): Promise<Response> => {
    return handleRequest(() => {
        const user = DB.users.find(u => (u.email === contactInfo || u.phoneNumber === contactInfo) && u.password === password);
        const doc = DB.doctors.find(d => (d.email === contactInfo || d.phoneNumber === contactInfo) && d.password === password);
        const center = DB.beautyCenters.find(c => (c.email === contactInfo || c.phoneNumber === contactInfo) && c.password === password);
        const lab = DB.laboratories.find(l => (l.email === contactInfo || l.phoneNumber === contactInfo) && l.password === password);
        
        const found = user || doc || center || lab;
        if (!found) throw new Error('بيانات الدخول غير صحيحة');
        if (found.status === 'disabled') throw new Error('تم تعطيل هذا الحساب');
        return found;
    });
};

export const register = async (userData: any): Promise<Response> => {
    return handleRequest(() => {
        if (DB.users.find(u => u.phoneNumber === userData.phoneNumber)) throw new Error('المستخدم موجود بالفعل');
        const newUser: User = { 
            id: `u-${Date.now()}`, 
            role: 'patient', 
            status: 'active',
            creationDate: new Date(),
            ...userData 
        };
        DB.users.push(newUser);
        return newUser;
    });
};

export const loginWithGoogle = async (token: string): Promise<Response> => {
    return handleRequest(() => {
        // Mock Google Login - In real app, verify token
        const mockEmail = "user@gmail.com";
        // Check if user exists in any role
        let user: User | Doctor | BeautyCenter | Laboratory | undefined = DB.users.find(u => u.email === mockEmail);
        if (!user) user = DB.doctors.find(d => d.email === mockEmail);
        if (!user) user = DB.beautyCenters.find(c => c.email === mockEmail);
        if (!user) user = DB.laboratories.find(l => l.email === mockEmail);

        if (!user) {
            user = { id: `u-google-${Date.now()}`, name: "Google User", email: mockEmail, role: 'patient', status: 'active' };
            DB.users.push(user);
        }
        return user;
    });
};

// Helper to fetch user by email (used for syncing Supabase session)
export const getUserByEmail = async (email: string): Promise<Response> => {
    return handleRequest(() => {
        let user: User | Doctor | BeautyCenter | Laboratory | undefined = DB.users.find(u => u.email === email);
        if (!user) user = DB.doctors.find(d => d.email === email);
        if (!user) user = DB.beautyCenters.find(c => c.email === email);
        if (!user) user = DB.laboratories.find(l => l.email === email);
        return user || null;
    });
}

export const sendRegistrationOtp = async (phoneNumber: string): Promise<Response> => {
    return handleRequest(() => { return { success: true, message: 'OTP sent' }; });
};

export const sendPasswordResetOtp = async (contactInfo: string): Promise<Response> => {
    return handleRequest(() => { return { success: true, message: 'OTP sent' }; });
};

export const verifyPasswordResetOtp = async (contactInfo: string, otp: string): Promise<Response> => {
    return handleRequest(() => { 
        if (otp !== '123456') throw new Error('Invalid OTP');
        return { success: true }; 
    });
};

export const resetPassword = async (contactInfo: string, otp: string, newPass: string): Promise<Response> => {
    return handleRequest(() => {
         const user = DB.users.find(u => u.email === contactInfo || u.phoneNumber === contactInfo);
         if (user) { user.password = newPass; return { success: true }; }
         const doc = DB.doctors.find(d => d.email === contactInfo || d.phoneNumber === contactInfo);
         if (doc) { doc.password = newPass; return { success: true }; }
         throw new Error('User not found');
    });
};


// --- PATIENT API ---

export const getPromotedDoctors = async (): Promise<Response> => {
    return handleRequest(() => DB.doctors.filter(d => d.promoted && d.status === 'active'));
};

export const getHomeDentists = async (): Promise<Response> => {
    return handleRequest(() => DB.doctors.filter(d => d.specialty.includes('أسنان') && d.showOnHome && d.status === 'active'));
};

export const getHomeBeautyCenters = async (): Promise<Response> => {
    return handleRequest(() => DB.beautyCenters.filter(c => c.showOnHome && c.status === 'active'));
};

export const getHomeLaboratories = async (): Promise<Response> => {
    return handleRequest(() => DB.laboratories.filter(l => l.showOnHome && l.status === 'active'));
};

export const getSpecialties = async (): Promise<Response> => {
    return handleRequest(() => [...new Set(DB.doctors.map(d => d.specialty))]);
};

export const getGovernorates = async (): Promise<Response> => {
    return handleRequest(() => ['بغداد', 'البصرة', 'أربيل', 'نينوى', 'النجف', 'كربلاء']); // Add more as needed
};

export const searchDoctors = async (query: string, specialty: string, governorate: string): Promise<Response> => {
    return handleRequest(() => DB.doctors.filter(d => 
        (d.name.includes(query) || d.bio.includes(query)) &&
        (specialty ? d.specialty === specialty : true) &&
        (governorate ? d.governorate === governorate : true) &&
        d.status === 'active'
    ));
};

export const searchBeautyCenters = async (query: string, governorate: string): Promise<Response> => {
    return handleRequest(() => DB.beautyCenters.filter(c => 
        c.name.includes(query) && 
        (governorate ? c.governorate === governorate : true) && 
        c.status === 'active'
    ));
};

export const searchLaboratories = async (query: string, governorate: string): Promise<Response> => {
    return handleRequest(() => DB.laboratories.filter(l => 
        l.name.includes(query) && 
        (governorate ? l.governorate === governorate : true) && 
        l.status === 'active'
    ));
};

export const getAvailableTimeSlots = async (entityId: string, type: string, date: Date | string, duration: number): Promise<Response> => {
    return handleRequest(() => {
        let entity: Doctor | BeautyCenter | Laboratory | undefined;
        let existingBookings: any[] = [];

        if (type === 'doctor') {
            entity = DB.doctors.find(d => d.id === entityId);
            existingBookings = DB.appointments.filter(a => a.doctorId === entityId && a.status !== 'canceled');
        } else if (type === 'beauty_center') {
            entity = DB.beautyCenters.find(c => c.id === entityId);
            existingBookings = DB.beautyBookings.filter(b => b.centerId === entityId && b.status !== 'canceled');
        } else if (type === 'laboratory') {
            entity = DB.laboratories.find(l => l.id === entityId);
            existingBookings = DB.labBookings.filter(b => b.labId === entityId && b.status !== 'canceled');
        }

        if (!entity || !entity.schedule) return [];

        const schedule = entity.schedule;
        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.getDay(); // 0 = Sunday

        // Check if it's a working day
        if (!schedule.workDays.includes(dayOfWeek)) return [];

        // Check if it's a specific day off (format YYYY-MM-DD)
        const dateString = requestedDate.toISOString().split('T')[0];
        if (schedule.daysOff && schedule.daysOff.includes(dateString)) return [];

        // Generate slots
        const slots = [];
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

        const startTime = new Date(requestedDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(requestedDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        let currentSlot = new Date(startTime);
        const durationMs = duration * 60000;

        while (currentSlot.getTime() + durationMs <= endTime.getTime()) {
            // Check for collision with existing bookings
            const slotEnd = new Date(currentSlot.getTime() + durationMs);
            const isOccupied = existingBookings.some(booking => {
                const bookingStart = new Date(booking.startTime);
                const bookingEnd = new Date(booking.endTime);
                
                // Simple overlap check
                return (currentSlot < bookingEnd && slotEnd > bookingStart);
            });

            if (!isOccupied) {
                slots.push(new Date(currentSlot));
            }

            // Move to next slot
            currentSlot = new Date(currentSlot.getTime() + durationMs);
        }

        return slots;
    });
};

export const bookAppointment = async (details: any): Promise<Response> => {
    return handleRequest(() => {
        const apt: Appointment = {
            id: `apt-${Date.now()}`,
            type: 'doctor',
            status: 'scheduled',
            endTime: new Date(new Date(details.startTime).getTime() + 30*60000),
            ...details
        };
        DB.appointments.push(apt);
        // Also add to doctor's local list
        const doc = DB.doctors.find(d => d.id === details.doctorId);
        if (doc) doc.appointments.push(apt);
        return apt;
    });
};

export const bookBeautyService = async (details: any): Promise<Response> => {
    return handleRequest(() => {
        const booking: BeautyBooking = {
            id: `bb-${Date.now()}`,
            type: 'beauty',
            status: 'scheduled',
            serviceName: details.service?.name || details.offer?.name,
            servicePrice: details.service?.price || details.offer?.price,
            endTime: new Date(new Date(details.startTime).getTime() + (details.service?.duration || 60)*60000),
            ...details
        };
        DB.beautyBookings.push(booking);
        const center = DB.beautyCenters.find(c => c.id === details.centerId);
        if (center) center.bookings.push(booking);
        return booking;
    });
};

export const bookLabTest = async (details: any): Promise<Response> => {
    return handleRequest(() => {
        const booking: LabBooking = {
            id: `lb-${Date.now()}`,
            type: 'lab',
            status: 'scheduled',
            testName: details.test?.name || details.offer?.name,
            testPrice: details.test?.price || details.offer?.price,
            endTime: new Date(new Date(details.startTime).getTime() + (details.test?.duration || 15)*60000),
            ...details
        };
        DB.labBookings.push(booking);
        const lab = DB.laboratories.find(l => l.id === details.labId);
        if (lab) lab.bookings.push(booking);
        return booking;
    });
};

export const fetchDoctorReviews = async (doctorId: string): Promise<Response> => {
    return handleRequest(() => DB.reviews.filter(r => r.doctorId === doctorId && r.isVisible));
};

export const getPatientAppointments = async (patientId: string): Promise<Response> => {
    return handleRequest(() => {
        const apts = DB.appointments.filter(a => a.patientId === patientId);
        const bbs = DB.beautyBookings.filter(b => b.patientId === patientId);
        const lbs = DB.labBookings.filter(l => l.patientId === patientId);
        return [...apts, ...bbs, ...lbs].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    });
};

export const getMedicalRecord = async (patientId: string): Promise<Response> => {
    return handleRequest(() => DB.medicalRecords.find(r => r.patientId === patientId) || null);
};

export const updateMedicalRecord = async (patientId: string, record: Partial<MedicalRecord>): Promise<Response> => {
    return handleRequest(() => {
        let rec = DB.medicalRecords.find(r => r.patientId === patientId);
        if (rec) {
            Object.assign(rec, record);
        } else {
            rec = { patientId, ...record } as MedicalRecord;
            DB.medicalRecords.push(rec);
        }
        return rec;
    });
};


// --- DOCTOR API ---

export const generateAppointmentReminders = async (doctorId: string, role: string): Promise<Response> => {
    return handleRequest(() => { return { sent: 0 }; }); // No-op mock
};

export const fetchUserNotifications = async (userId: string): Promise<Response> => {
    return handleRequest(() => DB.notifications.filter(n => n.userId === userId));
};

export const markNotificationAsRead = async (id: string): Promise<Response> => {
    return handleRequest(() => {
        const n = DB.notifications.find(ni => ni.id === id);
        if (n) n.read = true;
        return { success: true };
    });
};

export const updateDoctorProfile = async (id: string, data: Partial<Doctor>): Promise<Response> => {
    return handleRequest(() => {
        const doc = DB.doctors.find(d => d.id === id);
        if (!doc) throw new Error('Doctor not found');
        Object.assign(doc, data);
        return doc;
    });
};

export const updateDoctorSchedule = async (id: string, schedule: DoctorSchedule): Promise<Response> => {
    return handleRequest(() => {
        const doc = DB.doctors.find(d => d.id === id);
        if (!doc) throw new Error('Doctor not found');
        doc.schedule = schedule;
        return doc;
    });
};

export const updateDoctorGallery = async (id: string, gallery: GalleryImage[]): Promise<Response> => {
    return handleRequest(() => {
        const doc = DB.doctors.find(d => d.id === id);
        if (!doc) throw new Error('Doctor not found');
        doc.gallery = gallery;
        return doc;
    });
};

export const updateAppointmentNotes = async (id: string, notes: string): Promise<Response> => {
    return handleRequest(() => {
        const apt = DB.appointments.find(a => a.id === id);
        if (apt) apt.doctorNotes = notes;
        // Update in doctor's local list too
        DB.doctors.forEach(d => {
            if(d.appointments) {
                 const da = d.appointments.find(a => a.id === id);
                 if (da) da.doctorNotes = notes;
            }
        });
        return apt;
    });
};

export const getReportData = async (id: string, type: string, start: Date, end: Date): Promise<Response> => {
    return handleRequest(() => {
        // Mock report data
        return {
            summary: { totalRevenue: 500000, totalBookings: 25, newPatients: 5, completionRate: 90 },
            revenueOverTime: [],
            bookingsByStatus: { scheduled: 10, completed: 12, canceled: 3 },
            topServices: [{ name: 'Test Service', count: 10, revenue: 100000 }],
            detailedBookings: [],
            newPatientCountByDate: []
        };
    });
};

export const getDoctorPatients = async (doctorId: string): Promise<Response> => {
    return handleRequest(() => {
        // Source of truth should be the main appointments list
        const appointments = DB.appointments.filter(a => a.doctorId === doctorId);
        const uniquePatients = new Set(appointments.map(a => a.patientId));
        return Array.from(uniquePatients).map(pid => {
            const p = DB.users.find(u => u.id === pid);
            const patApts = appointments.filter(a => a.patientId === pid);
            const last = patApts.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
            return {
                id: pid,
                name: p?.name || patApts[0].patientName,
                totalAppointments: patApts.length,
                lastVisit: last ? last.startTime : null
            };
        });
    });
};


// --- ADMIN API ---

export const fetchAllPatients = async (): Promise<Response> => handleRequest(() => DB.users.filter(u => u.role === 'patient'));
export const updatePatientByAdmin = async (id: string, data: any): Promise<Response> => {
    return handleRequest(() => {
        const u = DB.users.find(user => user.id === id);
        if (u) Object.assign(u, data);
        return u;
    });
};
export const updatePatientStatusByAdmin = async (id: string, status: any): Promise<Response> => {
    return handleRequest(() => {
        const u = DB.users.find(user => user.id === id);
        if (u) u.status = status;
        return u;
    });
};
export const deletePatientByAdmin = async (id: string): Promise<Response> => {
    return handleRequest(() => {
        DB.users = DB.users.filter(u => u.id !== id);
        return { success: true };
    });
};

export const fetchAllDoctors = async (): Promise<Response> => handleRequest(() => DB.doctors);
export const updateDoctorByAdmin = async (id: string, data: any): Promise<Response> => {
    return handleRequest(() => {
        const d = DB.doctors.find(doc => doc.id === id);
        if (d) Object.assign(d, data);
        return d;
    });
};
export const addDoctorByAdmin = async (data: any): Promise<Response> => {
    return handleRequest(() => {
        const newDoc = { id: `d-${Date.now()}`, role: 'doctor', appointments: [], gallery: [], schedule: { workDays: [], startTime: '09:00', endTime: '17:00', appointmentDurationMinutes: 30 }, ...data };
        DB.doctors.push(newDoc);
        return newDoc;
    });
};
export const updateDoctorStatus = async (id: string, status: any): Promise<Response> => {
    return handleRequest(() => {
        const d = DB.doctors.find(doc => doc.id === id);
        if (d) d.status = status;
        return d;
    });
};

export const fetchAllBeautyCenters = async (): Promise<Response> => handleRequest(() => DB.beautyCenters);
export const updateBeautyCenterByAdmin = async (id: string, data: any): Promise<Response> => {
    return handleRequest(() => {
        const c = DB.beautyCenters.find(center => center.id === id);
        if (c) Object.assign(c, data);
        return c;
    });
};
export const addBeautyCenterByAdmin = async (data: any): Promise<Response> => {
    return handleRequest(() => {
        const newCenter = { id: `bc-${Date.now()}`, role: 'beauty_center', bookings: [], gallery: [], services: [], offers: [], schedule: { workDays: [], startTime: '09:00', endTime: '17:00', appointmentDurationMinutes: 60 }, ...data };
        DB.beautyCenters.push(newCenter);
        return newCenter;
    });
};

export const fetchAllLaboratories = async (): Promise<Response> => handleRequest(() => DB.laboratories);
export const updateLaboratoryByAdmin = async (id: string, data: any): Promise<Response> => {
    return handleRequest(() => {
        const l = DB.laboratories.find(lab => lab.id === id);
        if (l) Object.assign(l, data);
        return l;
    });
};
export const addLaboratoryByAdmin = async (data: any): Promise<Response> => {
    return handleRequest(() => {
        const newLab = { id: `l-${Date.now()}`, role: 'laboratory', bookings: [], gallery: [], tests: [], offers: [], schedule: { workDays: [], startTime: '08:00', endTime: '20:00', appointmentDurationMinutes: 15 }, ...data };
        DB.laboratories.push(newLab);
        return newLab;
    });
};

export const updateDoctorPromotion = async (id: string, promoted: boolean): Promise<Response> => {
    return handleRequest(() => {
        const d = DB.doctors.find(doc => doc.id === id);
        if (d) d.promoted = promoted;
        return d;
    });
};
export const updateDoctorHomeVisibility = async (id: string, show: boolean): Promise<Response> => {
    return handleRequest(() => {
        const d = DB.doctors.find(doc => doc.id === id);
        if (d) d.showOnHome = show;
        return d;
    });
};
export const updateBeautyCenterHomeVisibility = async (id: string, show: boolean): Promise<Response> => {
    return handleRequest(() => {
        const c = DB.beautyCenters.find(center => center.id === id);
        if (c) c.showOnHome = show;
        return c;
    });
};
export const updateLaboratoryHomeVisibility = async (id: string, show: boolean): Promise<Response> => {
    return handleRequest(() => {
        const l = DB.laboratories.find(lab => lab.id === id);
        if (l) l.showOnHome = show;
        return l;
    });
};

export const fetchAllReviews = async (): Promise<Response> => handleRequest(() => DB.reviews);
export const updateReviewVisibility = async (id: string, visible: boolean): Promise<Response> => {
    return handleRequest(() => {
        const r = DB.reviews.find(review => review.id === id);
        if (r) r.isVisible = visible;
        return r;
    });
};

export const fetchActivityLog = async (): Promise<Response> => handleRequest(() => DB.activityLogs);
export const getSystemStats = async (): Promise<Response> => handleRequest(() => ({
    activeUsers: DB.users.length + DB.doctors.length,
    pendingAppointments: DB.appointments.filter(a => a.status === 'scheduled').length,
    criticalAlerts: 0
}));


// --- BEAUTY CENTER SPECIFIC ---

export const updateBeautyCenterProfile = async (id: string, data: any): Promise<Response> => updateBeautyCenterByAdmin(id, data);
export const updateBeautyCenterSchedule = async (id: string, schedule: any): Promise<Response> => {
    return handleRequest(() => {
        const c = DB.beautyCenters.find(center => center.id === id);
        if (c) c.schedule = schedule;
        return c;
    });
};
export const updateBeautyCenterServices = async (id: string, services: any): Promise<Response> => {
    return handleRequest(() => {
        const c = DB.beautyCenters.find(center => center.id === id);
        if (c) c.services = services;
        return c;
    });
};
export const updateBeautyCenterGallery = async (id: string, gallery: any): Promise<Response> => {
    return handleRequest(() => {
        const c = DB.beautyCenters.find(center => center.id === id);
        if (c) c.gallery = gallery;
        return c;
    });
};
export const updateBeautyCenterOffers = async (id: string, offers: any): Promise<Response> => {
    return handleRequest(() => {
        const c = DB.beautyCenters.find(center => center.id === id);
        if (c) c.offers = offers;
        return c;
    });
};
export const addBeautyBookingByCenter = async (data: any): Promise<Response> => bookBeautyService(data);

export const updateBookingNotes = async (id: string, notes: string): Promise<Response> => {
    return handleRequest(() => {
        const b = DB.beautyBookings.find(booking => booking.id === id);
        if (b) b.centerNotes = notes;
        const center = DB.beautyCenters.find(c => c.bookings.some(bk => bk.id === id));
        if (center) {
            const cb = center.bookings.find(bk => bk.id === id);
            if (cb) cb.centerNotes = notes;
        }
        return b;
    });
};

export const cancelBooking = async (id: string, by: string): Promise<Response> => {
    return handleRequest(() => {
        const b = DB.beautyBookings.find(booking => booking.id === id);
        if (b) b.status = 'canceled';
        const center = DB.beautyCenters.find(c => c.bookings.some(bk => bk.id === id));
        if (center) {
            const cb = center.bookings.find(bk => bk.id === id);
            if (cb) cb.status = 'canceled';
        }
        
        // Also check regular appointments
        const a = DB.appointments.find(apt => apt.id === id);
        if (a) a.status = 'canceled';
        
        return b || a;
    });
};

// --- LABORATORY SPECIFIC ---

export const updateLaboratoryProfile = async (id: string, data: any): Promise<Response> => updateLaboratoryByAdmin(id, data);
export const updateLaboratoryTests = async (id: string, tests: any): Promise<Response> => {
    return handleRequest(() => {
        const l = DB.laboratories.find(lab => lab.id === id);
        if (l) l.tests = tests;
        return l;
    });
};
export const updateLaboratoryGallery = async (id: string, gallery: any): Promise<Response> => {
    return handleRequest(() => {
        const l = DB.laboratories.find(lab => lab.id === id);
        if (l) l.gallery = gallery;
        return l;
    });
};

export const cancelLabBooking = async (bookingId: string, cancelledBy: 'lab' | 'patient'): Promise<Response> => {
    return handleRequest(() => {
        const booking = DB.labBookings.find(b => b.id === bookingId);
        if (!booking) throw new Error('Booking not found');
        booking.status = 'canceled';

        const lab = DB.laboratories.find(l => l.id === booking.labId);
        if (lab) {
            const labBooking = lab.bookings.find(b => b.id === bookingId);
            if (labBooking) labBooking.status = 'canceled';
        }
        
        return booking;
    });
};
