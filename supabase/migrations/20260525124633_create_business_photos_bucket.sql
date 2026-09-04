insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-photos',
  'business-photos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];;
