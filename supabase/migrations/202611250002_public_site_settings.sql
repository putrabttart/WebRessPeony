-- Homepage may read presentation settings. Only admins retain write access.
create policy "site settings public read"
on public.site_settings for select
to anon, authenticated
using (true);
