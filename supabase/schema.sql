-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Places Table
create table places (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid, -- Optional for personal use
  kakao_id text not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  road_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(kakao_id) -- User-agnostic uniqueness for personal app
);

-- Favorites Table
create table favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  place_id uuid references places(id) on delete cascade not null,
  color text not null, -- Hex code
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(place_id)
);

-- Templates Table
create table templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Template Questions Table
create table template_questions (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references templates(id) on delete cascade not null,
  question_text text not null,
  order_idx int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid
);

-- Notes Table
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  place_id uuid references places(id) on delete cascade not null,
  template_id uuid references templates(id),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- External Links Table
create table external_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  place_id uuid references places(id) on delete cascade not null,
  title text not null, -- e.g. "Hogangnono"
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Disable Row Level Security for all tables
alter table places disable row level security;
alter table favorites disable row level security;
alter table templates disable row level security;
alter table template_questions disable row level security;
alter table notes disable row level security;
alter table external_links disable row level security;
