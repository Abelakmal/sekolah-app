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

