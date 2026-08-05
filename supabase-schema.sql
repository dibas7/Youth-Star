-- Enable extensions required for UUID generation
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  room_number text,
  role text not null check (role in ('student','warden')) default 'student',
  created_at timestamptz not null default now()
);

-- Meals table
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_date date not null,
  breakfast boolean not null default false,
  lunch boolean not null default false,
  dinner boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, meal_date)
);

-- Notices table
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Meal deadlines table
create table if not exists public.meal_deadlines (
  id uuid primary key default '00000000-0000-0000-0000-000000000000',
  breakfast time,
  lunch time,
  dinner time
);

-- Enable row-level security
alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.notices enable row level security;
alter table public.meal_deadlines enable row level security;

-- Helper functions
create or replace function public.current_user_profile()
returns public.profiles as $$
  select * from public.profiles where id = auth.uid();
$$ language sql security definer;

create or replace function public.is_warden()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'warden'
  );
$$;

-- RLS policies

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Wardens can view all profiles" ON public.profiles;
CREATE POLICY "Wardens can view all profiles" ON public.profiles
FOR SELECT USING (public.is_warden());

-- meals
DROP POLICY IF EXISTS "Students can view own meals" ON public.meals;
CREATE POLICY "Students can view own meals" ON public.meals
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own meals" ON public.meals;
CREATE POLICY "Students can insert own meals" ON public.meals
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own meals" ON public.meals;
CREATE POLICY "Students can update own meals" ON public.meals
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Wardens can view all meals" ON public.meals;
CREATE POLICY "Wardens can view all meals" ON public.meals
FOR SELECT USING (public.is_warden());

-- notices
DROP POLICY IF EXISTS "Anyone can read notices" ON public.notices;
CREATE POLICY "Anyone can read notices" ON public.notices
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Wardens can manage notices" ON public.notices;
CREATE POLICY "Wardens can manage notices" ON public.notices
FOR ALL USING (public.is_warden()) WITH CHECK (public.is_warden());

-- meal_deadlines
DROP POLICY IF EXISTS "Anyone can read deadlines" ON public.meal_deadlines;
CREATE POLICY "Anyone can read deadlines" ON public.meal_deadlines
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Wardens can manage deadlines" ON public.meal_deadlines;
CREATE POLICY "Wardens can manage deadlines" ON public.meal_deadlines
FOR ALL USING (public.is_warden()) WITH CHECK (public.is_warden());

-- Seed a default deadline row if none exists
insert into public.meal_deadlines (breakfast, lunch, dinner)
select '08:30', '13:00', '19:00'
where not exists (select 1 from public.meal_deadlines);
