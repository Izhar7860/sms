-- Society Services Marketplace schema (Supabase)
-- Tables:
--  - workers
--  - worker_categories
--  - service_bookings
--  - worker_reviews

-- Extensions (optional)
create extension if not exists "pgcrypto";

-- Workers table
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),

  society_id uuid,

  full_name text not null,
  profile_photo_url text,
  phone_number text not null,

  experience_years int not null default 0,

  availability_status text not null default 'available'
  check (availability_status in ('available','unavailable')),

  verified boolean not null default false,
  verification_badge_url text,

  id_proof_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories (normalized, supports many-to-many)
create table if not exists public.worker_categories (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,

  category_name text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (worker_id, category_name)
);

-- Bookings table
create table if not exists public.service_bookings (
  id uuid primary key default gen_random_uuid(),

  society_id uuid,
  resident_user_id uuid, -- FK to your auth/user table if you have one
  resident_name text,
  resident_phone text,
  resident_flat text,

  worker_id uuid not null references public.workers(id) on delete restrict,

  category_name text not null,

  issue_description text not null,

  -- Store uploaded image URLs (or JSON paths)
  issue_image_urls jsonb not null default '[]'::jsonb,

  booking_status text not null default 'Pending'
  check (booking_status in ('Pending','Accepted','In Progress','Completed','Rated')),

  requested_at timestamptz not null default now(),
  service_datetime timestamptz,

  accepted_at timestamptz,
  in_progress_at timestamptz,
  completed_at timestamptz,
  rated_at timestamptz,

  rating int check (rating between 1 and 5),
  rating_comment text,

  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_bookings_worker_id
  on public.service_bookings(worker_id);

create index if not exists idx_service_bookings_status
  on public.service_bookings(booking_status);

create index if not exists idx_service_bookings_category
  on public.service_bookings(category_name);

create index if not exists idx_service_bookings_requested_at
  on public.service_bookings(requested_at desc);

-- Worker reviews table
create table if not exists public.worker_reviews (
  id uuid primary key default gen_random_uuid(),

  worker_id uuid not null references public.workers(id) on delete cascade,

  booking_id uuid references public.service_bookings(id) on delete set null,

  reviewer_user_id uuid,
  reviewer_name text,

  stars int not null check (stars between 1 and 5),

  review_text text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (worker_id, booking_id)
);

create index if not exists idx_worker_reviews_worker_id
  on public.worker_reviews(worker_id);

create index if not exists idx_worker_reviews_stars
  on public.worker_reviews(stars desc);

-- Updated-at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_workers_updated_at on public.workers;
create trigger trg_workers_updated_at
before update on public.workers
for each row execute function public.set_updated_at();

drop trigger if exists trg_worker_categories_updated_at on public.worker_categories;
create trigger trg_worker_categories_updated_at
before update on public.worker_categories
for each row execute function public.set_updated_at();

-- Bookings has updated_at trigger
drop trigger if exists trg_service_bookings_updated_at on public.service_bookings;
create trigger trg_service_bookings_updated_at
before update on public.service_bookings
for each row execute function public.set_updated_at();

-- Reviews updated_at trigger
drop trigger if exists trg_worker_reviews_updated_at on public.worker_reviews;
create trigger trg_worker_reviews_updated_at
before update on public.worker_reviews
for each row execute function public.set_updated_at();

