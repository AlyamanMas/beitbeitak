-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

create type homs_town as ENUM(
  'Al-Hamidiyah',
  'Bab al-Dreib',
  'Bab Tadmur',
  'Bab Hud',
  'Al-Qarabis',
  'Al-Qusour',
  'Al-Waer',
  'Al-Ghouta',
  'Inshaat',
  'Al-Adawiyah'
  -- Add other towns as needed
);

CREATE TABLE public.users (
  id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  profile_pic uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT extra_user_information_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT extra_user_information_profile_pic_fkey FOREIGN KEY (profile_pic) REFERENCES storage.objects(id)
);
CREATE TABLE public.house_listings (
  id bigint NOT NULL DEFAULT nextval('house_listing_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  town homs_town NOT NULL,
  rent_per_month bigint NOT NULL CHECK (rent_per_month > 0),
  author uuid NOT NULL,
  size_m2 integer NOT NULL CHECK (size_m2 > 0),
  num_bedrooms smallint NOT NULL DEFAULT 1 CHECK (num_bedrooms >= 0),
  num_bathrooms smallint NOT NULL DEFAULT 1 CHECK (num_bathrooms >= 0),
  address text NOT NULL,
  location point,
  source_url text,
  phone_number text,
  whatsapp_comm boolean NOT NULL,
  rent_in_usd boolean NOT NULL,
  CONSTRAINT house_listings_pkey PRIMARY KEY (id),
  CONSTRAINT house_listing_author_fkey FOREIGN KEY (author) REFERENCES public.users(id)
);
CREATE TABLE public.listing_to_pic (
  listing_id bigint NOT NULL,
  pic_id uuid NOT NULL,
  CONSTRAINT listing_to_pic_pkey PRIMARY KEY (listing_id, pic_id),
  CONSTRAINT listing_to_pic_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.house_listings(id),
  CONSTRAINT listing_to_pic_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES storage.objects(id)
);
