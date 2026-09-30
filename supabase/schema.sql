create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'teacher')),
  teacher_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  name text not null,
  email text not null unique,
  identity_type text not null check (
    identity_type in ('NIP', 'NUPTK', 'No UKG', 'NIM')
  ),
  identity_number text not null default '',
  subject text not null default 'PJOK',
  classes int [] not null default '{1}',
  school_name text not null default '',
  principal_name text not null default '',
  principal_nip text not null default '',
  institution_name text not null default '',
  institution_logo_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teachers add column if not exists school_name text not null default '';
alter table public.teachers add column if not exists principal_name text not null default '';
alter table public.teachers add column if not exists principal_nip text not null default '';
alter table public.teachers add column if not exists institution_name text not null default '';
alter table public.teachers add column if not exists institution_logo_url text not null default '';
create table if not exists public.learning_topics (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  class_grade smallint not null check (
    class_grade between 1 and 6
  ),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  color text not null default 'bg-emerald-500',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learning_topics_teacher_grade_idx on public.learning_topics (teacher_id, class_grade, created_at desc);
create table if not exists public.topic_module_data (
  topic_id uuid primary key references public.learning_topics(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists topic_module_data_teacher_idx on public.topic_module_data (teacher_id);
create table if not exists public.learning_devices (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  topic text not null check (length(trim(topic)) > 0),
  file_name text not null,
  file_path text not null,
  file_url text not null,
  file_type text not null check (file_type in ('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  file_size integer not null check (file_size > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learning_devices_teacher_idx on public.learning_devices (teacher_id, created_at desc);
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'profiles_teacher_id_fkey'
) then
alter table public.profiles
add constraint profiles_teacher_id_fkey foreign key (teacher_id) references public.teachers(id) on delete
set null;
end if;
end $$;
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.learning_topics enable row level security;
alter table public.topic_module_data enable row level security;
alter table public.learning_devices enable row level security;
create or replace function public.is_admin(user_id uuid) returns boolean language sql security definer
set search_path = public stable as $$
select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;
grant execute on function public.is_admin(uuid) to authenticated;
drop policy if exists "topic_module_data_select_own_or_admin" on public.topic_module_data;
create policy "topic_module_data_select_own_or_admin" on public.topic_module_data for
select to authenticated using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = topic_module_data.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
drop policy if exists "topic_module_data_insert_own_or_admin" on public.topic_module_data;
create policy "topic_module_data_insert_own_or_admin" on public.topic_module_data for
insert to authenticated with check (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = topic_module_data.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
drop policy if exists "topic_module_data_update_own_or_admin" on public.topic_module_data;
create policy "topic_module_data_update_own_or_admin" on public.topic_module_data for
update to authenticated using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = topic_module_data.teacher_id
        and teachers.profile_id = auth.uid()
    )
  ) with check (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = topic_module_data.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
grant select,
  insert,
  update on public.topic_module_data to authenticated;
drop policy if exists "learning_devices_select_own_or_admin" on public.learning_devices;
create policy "learning_devices_select_own_or_admin" on public.learning_devices for select to authenticated using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.teachers where teachers.id = learning_devices.teacher_id and teachers.profile_id = auth.uid()
  )
);
drop policy if exists "learning_devices_insert_own_or_admin" on public.learning_devices;
create policy "learning_devices_insert_own_or_admin" on public.learning_devices for insert to authenticated with check (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.teachers where teachers.id = learning_devices.teacher_id and teachers.profile_id = auth.uid()
  )
);
drop policy if exists "learning_devices_update_own_or_admin" on public.learning_devices;
create policy "learning_devices_update_own_or_admin" on public.learning_devices for update to authenticated using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.teachers where teachers.id = learning_devices.teacher_id and teachers.profile_id = auth.uid()
  )) with check (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.teachers where teachers.id = learning_devices.teacher_id and teachers.profile_id = auth.uid()
  )
);
drop policy if exists "learning_devices_delete_own_or_admin" on public.learning_devices;
create policy "learning_devices_delete_own_or_admin" on public.learning_devices for delete to authenticated using (
  public.is_admin(auth.uid()) or exists (
    select 1 from public.teachers where teachers.id = learning_devices.teacher_id and teachers.profile_id = auth.uid()
  )
);
grant select, insert, update, delete on public.learning_devices to authenticated;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for
select to authenticated using (
    auth.uid() = id
    or public.is_admin(auth.uid())
  );
drop policy if exists "teachers_select_own_or_admin" on public.teachers;
create policy "teachers_select_own_or_admin" on public.teachers for
select to authenticated using (
    profile_id = auth.uid()
    or public.is_admin(auth.uid())
  );
drop policy if exists "teachers_update_own_or_admin" on public.teachers;
create policy "teachers_update_own_or_admin" on public.teachers for
update to authenticated using (
    profile_id = auth.uid()
    or public.is_admin(auth.uid())
  ) with check (
    profile_id = auth.uid()
    or public.is_admin(auth.uid())
  );
drop policy if exists "learning_topics_select_own_or_admin" on public.learning_topics;
create policy "learning_topics_select_own_or_admin" on public.learning_topics for
select to authenticated using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = learning_topics.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
drop policy if exists "learning_topics_insert_own_or_admin" on public.learning_topics;
create policy "learning_topics_insert_own_or_admin" on public.learning_topics for
insert to authenticated with check (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = learning_topics.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
drop policy if exists "learning_topics_update_own_or_admin" on public.learning_topics;
create policy "learning_topics_update_own_or_admin" on public.learning_topics for
update to authenticated using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = learning_topics.teacher_id
        and teachers.profile_id = auth.uid()
    )
  ) with check (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.teachers
      where teachers.id = learning_topics.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
drop policy if exists "learning_topics_delete_own_or_admin" on public.learning_topics;
create policy "learning_topics_delete_own_or_admin" on public.learning_topics for delete to authenticated using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.teachers
    where teachers.id = learning_topics.teacher_id
      and teachers.profile_id = auth.uid()
  )
);
grant select,
  insert,
  update,
  delete on public.learning_topics to authenticated;
-- Archive source IDs are text to support importing existing local draft IDs.
-- No topic foreign key: archives must survive deletion of their source topic.
create table if not exists public.administration_archives (
  id text primary key,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  topic_id text not null,
  title text not null check (length(trim(title)) > 0),
  version integer not null default 1 check (version > 0),
  change_notes text not null default '',
  objective_ids text[] not null default '{}',
  material_ids text[] not null default '{}',
  activity_ids text[] not null default '{}',
  assessment_ids text[] not null default '{}',
  snapshot jsonb check (snapshot is null or jsonb_typeof(snapshot) = 'object'),
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists administration_archives_teacher_created_idx
  on public.administration_archives (teacher_id, created_at desc);
alter table public.administration_archives enable row level security;
drop policy if exists "administration_archives_own_or_admin" on public.administration_archives;
create policy "administration_archives_own_or_admin"
  on public.administration_archives for all to authenticated
  using (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.teachers
      where teachers.id = administration_archives.teacher_id
        and teachers.profile_id = auth.uid()
    )
  )
  with check (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.teachers
      where teachers.id = administration_archives.teacher_id
        and teachers.profile_id = auth.uid()
    )
  );
grant select, insert, delete on public.administration_archives to authenticated;
-- Saved document content is immutable; only notes and timestamps can change.
revoke update on public.administration_archives from authenticated;
grant update (change_notes, last_downloaded_at, updated_at)
  on public.administration_archives to authenticated;
