-- ============================================================
-- AgriLink: farm_media Storage Bucket RLS Policies
-- Run this in Supabase SQL Editor AFTER creating the bucket
-- ============================================================

-- Allow authenticated farmers to upload files
create policy "Farmers can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'farm_media');

-- Allow everyone (including guests/TikTok visitors) to view/download media
create policy "Public can view farm media"
  on storage.objects for select
  using (bucket_id = 'farm_media');

-- Allow farmers to delete their own uploads
create policy "Farmers can delete their media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'farm_media');
