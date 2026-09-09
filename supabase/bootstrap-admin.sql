-- 1. Buat user admin lebih dulu di Supabase Dashboard:
--    Authentication > Users > Add user
--
-- 2. Ganti email di bawah sesuai email admin yang kamu buat.
--    Jalankan SQL ini di SQL Editor Supabase.
insert into public.profiles (id, email, name, role)
select id,
  email,
  coalesce(raw_user_meta_data->>'name', 'Admin'),
  'admin'
from auth.users
where email = 'abelakmal06@gmail.com' on conflict (id) do
update
set email = excluded.email,
  name = excluded.name,
  role = 'admin',
  updated_at = now();