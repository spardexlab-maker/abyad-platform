
# 🗄️ دليل إعداد قاعدة البيانات (Supabase)

هذا الملف يحتوي على كود SQL الكامل اللازم لتشغيل مشروع "أَبْيَض".
يستخدم المشروع **Supabase** كـ Backend (قاعدة بيانات PostgreSQL + مصادقة).

## ⚡ طريقة التنفيذ السريعة

1. اذهب إلى لوحة تحكم مشروعك في Supabase.
2. من القائمة الجانبية، اختر **SQL Editor**.
3. اضغط على **New Query**.
4. انسخ الكود الموجود بالأسفل بالكامل والصقه هناك.
5. اضغط **Run**.

---

## 📜 كود SQL الشامل (Schema & Policies)

```sql
-- 1. تفعيل الإضافات الضرورية
create extension if not exists "uuid-ossp";

-- 2. إنشاء جدول الملفات الشخصية (Profiles)
-- هذا الجدول مرتبط بجدول المستخدمين الخاص بـ Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text check (role in ('admin', 'doctor', 'patient', 'beauty_center', 'laboratory')) default 'patient',
  phone_number text,
  avatar_url text,
  governorate text,
  location_text text,
  lat float,
  lng float,
  bio text,
  status text default 'active' check (status in ('active', 'disabled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. تفعيل الحماية (Row Level Security)
alter table public.profiles enable row level security;

-- سياسات الأمان للملفات الشخصية:
-- الجميع يمكنهم قراءة البيانات (للبحث عن الأطباء وغيرهم)
create policy "Profiles are viewable by everyone" 
  on profiles for select using (true);

-- المستخدم يمكنه تعديل ملفه الشخصي فقط
create policy "Users can insert their own profile" 
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update using (auth.uid() = id);

-- 4. جدول تفاصيل الأطباء (Doctors Details)
-- لتخزين معلومات إضافية خاصة بالأطباء فقط
create table public.doctors_details (
  id uuid references public.profiles(id) on delete cascade primary key,
  specialty text,
  experience_years int default 0,
  consultation_fee int default 0,
  rating float default 5.0,
  schedule jsonb, -- تخزين الجدول كـ JSON
  gallery text[], -- مصفوفة روابط صور
  certifications text[]
);

alter table public.doctors_details enable row level security;
create policy "Doctors details viewable by everyone" on doctors_details for select using (true);
create policy "Doctors can update own details" on doctors_details for update using (auth.uid() = id);
create policy "Doctors can insert own details" on doctors_details for insert with check (auth.uid() = id);

-- 5. جدول المراكز (مراكز تجميل ومختبرات)
-- يمكن دمجهما أو فصلهما، سنستخدم جدول تفاصيل عام للمراكز
create table public.centers_details (
  id uuid references public.profiles(id) on delete cascade primary key,
  center_type text check (center_type in ('beauty_center', 'laboratory')),
  services jsonb, -- قائمة الخدمات والأسعار
  offers jsonb, -- العروض
  schedule jsonb,
  gallery text[]
);

alter table public.centers_details enable row level security;
create policy "Centers details viewable by everyone" on centers_details for select using (true);
create policy "Centers can update own details" on centers_details for update using (auth.uid() = id);
create policy "Centers can insert own details" on centers_details for insert with check (auth.uid() = id);

-- 6. جدول الحجوزات (Appointments)
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  
  -- مقدم الخدمة (طبيب، مركز، مختبر)
  provider_id uuid references public.profiles(id) not null,
  
  -- المريض
  patient_id uuid references public.profiles(id) not null,
  patient_name text, -- للتسهيل في العرض
  
  -- تفاصيل الموعد
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  type text check (type in ('doctor', 'beauty', 'lab')),
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'canceled')),
  
  -- تفاصيل الخدمة
  service_name text,
  price int,
  
  -- ملاحظات
  notes text,
  provider_notes text
);

alter table public.appointments enable row level security;

-- سياسات الحجوزات:
-- المريض يرى حجوزاته، ومقدم الخدمة يرى الحجوزات القادمة له
create policy "Users can see their own appointments" 
  on appointments for select 
  using (auth.uid() = patient_id or auth.uid() = provider_id);

create policy "Users can create appointments" 
  on appointments for insert 
  with check (auth.uid() = patient_id);

create policy "Provider and Patient can update appointment status" 
  on appointments for update 
  using (auth.uid() = patient_id or auth.uid() = provider_id);

-- 7. دالة (Trigger) لإنشاء ملف شخصي تلقائياً عند التسجيل
-- هذه الدالة تعمل تلقائياً عندما يسجل مستخدم جديد عبر Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, phone_number)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'patient'), -- الافتراضي مريض
    new.raw_user_meta_data->>'phone_number'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ربط الدالة بجدول auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. إعداد Storage (لتخزين الصور)
-- ستحتاج لإنشاء Bucket باسم 'avatars' و 'gallery' يدوياً من لوحة التحكم،
-- أو استخدام الكود التالي إذا كانت لديك صلاحيات:
insert into storage.buckets (id, name) values ('avatars', 'avatars');
insert into storage.buckets (id, name) values ('gallery', 'gallery');

-- سياسة تخزين بسيطة (للتجربة): السماح للجميع برفع الصور
create policy "Allow public uploads" on storage.objects for insert with check (bucket_id in ('avatars', 'gallery'));
create policy "Allow public viewing" on storage.objects for select using (bucket_id in ('avatars', 'gallery'));
```

---

## 🔐 إعداد تسجيل الدخول عبر Google

1. اذهب إلى **Authentication** -> **Providers**.
2. فعل **Google**.
3. ستحتاج Client ID من Google Cloud Console.
4. تأكد من إضافة رابط الـ Redirect في Google Console:
   `https://<project-id>.supabase.co/auth/v1/callback`

---

## 🛠️ ملاحظات هامة

*   **الأدمن (Admin):** لإنشاء أدمن، قم بالتسجيل كمستخدم عادي، ثم اذهب لجدول `profiles` في Supabase وغير قيمة `role` يدوياً إلى `admin`.
*   **الجداول الإضافية:** يمكنك إضافة جداول للتقييمات (`reviews`)، والسجلات الطبية (`medical_records`) بنفس النمط المذكور أعلاه.
