-- ============================================================================
-- Atelier Brodé — seed
--
-- The catalogue is intentionally empty. Categories and store settings are
-- created by supabase/schema.sql; every garment is added by the atelier from
-- /admin/products so nothing fake reaches the storefront.
--
-- Run AFTER supabase/schema.sql. Safe to re-run.
-- ============================================================================

-- Remove the eight garments that shipped with the original design mock-ups.
-- Deleting by slug leaves anything the atelier has added untouched.
delete from public.products
where slug in (
  'sovereign-heavyweight-hoodie',
  'nocturne-pullover-hoodie',
  'herbarium-boxy-tee',
  'atelier-boxy-heavyweight-tee',
  'flax-artisan-overshirt',
  'sculpted-six-panel-cap',
  'archival-french-terry-crewneck',
  'custom-canvas-hoodie-blank'
);
