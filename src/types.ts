export enum AppView {
  Welcome,
  Login,
  Register,
  PatientHome,
  PatientDoctorList,
  PatientDoctorProfile,
  PatientBookingConfirmation,
  PatientAppointments,
  PatientProfile,
  PatientMedicalRecord,
  PatientBeautyCenterList,
  PatientBeautyCenterProfile,
  PatientBeautyBookingConfirmation,
  PatientLabList,
  PatientLabProfile,
  PatientLabBookingConfirmation,
  DoctorDashboard,
  AdminDashboard,
  BeautyCenterDashboard,
  LaboratoryDashboard,
}

export type UserRole = 'doctor' | 'admin' | 'patient' | 'beauty_center' | 'laboratory';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  password?: string; 
  phoneNumber?: string;
  status?: 'active' | 'disabled';
  creationDate?: Date;
}

export interface DoctorSchedule {
  workDays: number[]; 
  startTime: string; 
  endTime: string; 
  appointmentDurationMinutes: number;
  daysOff?: string[]; 
}

export interface PublicNote {
    text?: string;
    fileUrl?: string; // For images or PDFs
    fileName?: string;
}

export interface Appointment {
  id: string;
  type: 'doctor';
  doctorId: string;
  patientId: string; 
  patientName: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'completed' | 'canceled';
  patientLocation?: string; 
  doctorNotes?: string; // Private notes
  patientNotes?: string;
  publicDoctorNotes?: PublicNote; // Notes visible to patient
}

export interface BeautyService {
    id: string;
    name: string;
    price: number;
    duration: number; // in minutes
}

export interface BeautyBooking {
    id: string;
    type: 'beauty';
    centerId: string;
    patientId: string;
    patientName: string;
    serviceName: string;
    servicePrice: number;
    startTime: Date;
    endTime: Date;
    status: 'scheduled' | 'completed' | 'canceled';
    centerNotes?: string;
    patientNotes?: string;
    offerId?: string;
    offerName?: string;
}

export interface LabTest {
    id: string;
    name: string;
    price: number;
    duration: number; // in minutes
    instructions?: string;
}

export interface LabBooking {
    id: string;
    type: 'lab';
    labId: string;
    patientId: string;
    patientName: string;
    testName: string;
    testPrice: number;
    startTime: Date;
    endTime: Date;
    status: 'scheduled' | 'completed' | 'canceled';
    labNotes?: string;
    patientNotes?: string;
    resultUrl?: string;
    offerId?: string;
    offerName?: string;
}

export type PatientBooking = Appointment | BeautyBooking | LabBooking;


export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  experienceYears: number;
  governorate: string;
  location: string;
  lat: number; 
  lng: number; 
  rating: number;
  profilePicture: string;
  appointments: Appointment[];
  schedule: DoctorSchedule;
  promoted: boolean;
  showOnHome?: boolean;
  bio: string;
  consultationFee?: number; 
  phoneNumber?: string;
  certifications?: string[];
  gallery: GalleryImage[];
  status: 'active' | 'disabled';
}

export interface GalleryImage {
    id: string;
    imageUrl: string;
    description: string;
}

export interface OfferPackage {
    id: string;
    name: string;
    description: string;
    price: number;
    itemIds: string[]; // IDs of services or tests included
    type: 'service' | 'test';
    originalPrice: number;
    duration: number;
}


export interface BeautyCenter extends User {
    role: 'beauty_center';
    governorate: string;
    location: string;
    lat: number;
    lng: number;
    profilePicture: string;
    bio: string;
    phoneNumber?: string;
    services: BeautyService[];
    bookings: BeautyBooking[];
    schedule: DoctorSchedule; 
    showOnHome?: boolean;
    status: 'active' | 'disabled';
    gallery: GalleryImage[];
    offers: OfferPackage[];
}

export interface Laboratory extends User {
    role: 'laboratory';
    governorate: string;
    location: string;
    lat: number;
    lng: number;
    profilePicture: string;
    bio: string;
    phoneNumber?: string;
    tests: LabTest[];
    bookings: LabBooking[];
    schedule: DoctorSchedule;
    showOnHome?: boolean;
    status: 'active' | 'disabled';
    gallery: GalleryImage[];
    offers: OfferPackage[];
}


export interface Admin extends User {
  role: 'admin';
}

export interface Patient extends User {
    role: 'patient';
}

export interface PatientSummary {
    id: string;
    name: string;
    totalAppointments: number;
    lastVisit: Date | null;
}

export interface ActivityLog {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  appointmentId: string; 
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'reminder' | 'cancellation' | 'info';
}

export interface Review {
  id: string;
  doctorId: string; // Could be expanded to include centers
  patientId: string;
  patientName: string;
  rating: number; 
  comment: string;
  timestamp: Date;
  isVisible: boolean; 
}

export interface AppSettings {
  appName: string;
  appLogoUrl: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
}

export interface MedicalRecord {
    patientId: string;
    age: number;
    gender: 'ذكر' | 'أنثى' | 'غير محدد';
    bloodType: string;
    height: string;
    weight: string;
    allergies: string[];
    chronicConditions: string[];
    pastSurgeries: string[];
    familyHistory: string[];
    medications: string[];
    lastUpdated: Date;
}

export interface ReportData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    newPatients: number;
    completionRate: number;
  };
  revenueOverTime: { date: string; revenue: number }[];
  bookingsByStatus: { scheduled: number; completed: number; canceled: number };
  topServices: { name: string; count: number; revenue: number }[];
  detailedBookings: PatientBooking[];
  newPatientCountByDate: { date: string; count: number }[];
}