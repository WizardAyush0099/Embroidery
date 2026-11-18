-- ============================================================================
-- Atelier Brodé — starter catalogue
-- Run AFTER supabase/schema.sql. Uses the photography extracted from the
-- Stitch designs, served locally from /public/images/stitch.
-- Safe to re-run: existing slugs are left untouched so admin edits persist.
-- ============================================================================

insert into public.products (
  name, slug, description, fabric_label, technique, stitch_count,
  price, compare_at_price, category_id, images, sizes, colors, size_stock, stock,
  is_featured, is_new_arrival, is_published, is_customisable
)
select
  v.name, v.slug, v.description, v.fabric_label, v.technique, v.stitch_count,
  v.price, v.compare_at_price, c.id, v.images, v.sizes, v.colors::jsonb, v.size_stock::jsonb,
  v.stock, v.is_featured, v.is_new_arrival, true, v.is_customisable
from (
  values
  (
    'The Sovereign Heavyweight Hoodie',
    'sovereign-heavyweight-hoodie',
    'Our signature 450 GSM organic French terry hoodie, cut oversized with a sculptural hood and finished with a hand-guided botanical monogram. Pre-shrunk under tension so the embroidery never puckers.',
    '450 GSM Organic Fleece',
    'Satin Stitch & Micro-Chain',
    22400,
    8900::numeric, 10500::numeric,
    'heavyweight-hoodies',
    array['/images/stitch/s23-editorial-close-up-front-angle-of-an.jpg','/images/stitch/s28-editorial-garment-photograph-of-the-sovereign-heavyweight.jpg','/images/stitch/s24-extreme-macro-lens-photograph-of-dense-raised.jpg','/images/stitch/s45-macro-luxury-shot-of-heavy-450-gsm.jpg'],
    array['S','M','L','XL','XXL'],
    '[{"name":"Mineral Sage","hex":"#7d8a76"},{"name":"Raw Ecru","hex":"#e8e4da"},{"name":"Washed Noir","hex":"#202020"}]',
    '{"S":6,"M":10,"L":12,"XL":8,"XXL":4}',
    40, true, false, true
  ),
  (
    'Nocturne Pullover Hoodie',
    'nocturne-pullover-hoodie',
    'A 450 GSM brushed fleece pullover in a deep pigment-washed charcoal, carrying a golden heraldic crest across the upper spine. Weighted, warm and built as an heirloom canvas.',
    '450 GSM Brushed Fleece',
    'High-Density Satin & Gold Filament',
    18600,
    9400::numeric, 11200::numeric,
    'heavyweight-hoodies',
    array['/images/stitch/s09-studio-catalog-shot-of-a-heavyweight-450.jpg','/images/stitch/s21-extreme-macro-square-shot-of-custom-monogram.jpg','/images/stitch/s45-macro-luxury-shot-of-heavy-450-gsm.jpg','/images/stitch/s46-high-fashion-close-up-of-charcoal-pigment.jpg'],
    array['S','M','L','XL'],
    '[{"name":"Washed Noir","hex":"#202020"},{"name":"Espresso","hex":"#4a3b32"},{"name":"Bone","hex":"#e3ddd1"}]',
    '{"S":4,"M":7,"L":9,"XL":3}',
    23, true, false, true
  ),
  (
    'Herbarium Boxy Tee',
    'herbarium-boxy-tee',
    'A 260 GSM organic jersey tee cut boxy and cropped, with a botanical crest embroidered on the left chest in mulberry silk sage and bronze. The everyday piece of the atelier wardrobe.',
    '260 GSM Organic Jersey',
    'French Knot & Stem Stitch',
    12800,
    4200::numeric, 4800::numeric,
    'oversized-t-shirts',
    array['/images/stitch/s01-close-up-editorial-flatlay-of-an-ecru.jpg','/images/stitch/s06-high-angle-shot-of-crisp-ecru-oversized.jpg','/images/stitch/s35-close-up-photography-of-delicate-floral-needlework.jpg'],
    array['S','M','L','XL'],
    '[{"name":"Raw Ecru","hex":"#e8e4da"},{"name":"Washed Noir","hex":"#202020"},{"name":"Sagebrush","hex":"#5c6656"}]',
    '{"S":8,"M":12,"L":14,"XL":6}',
    40, true, true, true
  ),
  (
    'Atelier Boxy Heavyweight Tee',
    'atelier-boxy-heavyweight-tee',
    'A 300 GSM heavy jersey tee in pigment-washed charcoal with subtle sleeve coordinate embroidery and a soft-washed hand. Layer it under a hoodie or wear alone.',
    '300 GSM Heavy Jersey',
    'Fine Coordinate Lettering',
    9400,
    3900::numeric, null::numeric,
    'oversized-t-shirts',
    array['/images/stitch/s30-editorial-photo-of-a-heavyweight-boxy-black.jpg','/images/stitch/s46-high-fashion-close-up-of-charcoal-pigment.jpg'],
    array['S','M','L','XL','XXL'],
    '[{"name":"Washed Charcoal","hex":"#202020"},{"name":"Bone","hex":"#e3ddd1"}]',
    '{"S":3,"M":6,"L":8,"XL":5,"XXL":2}',
    24, false, true, true
  ),
  (
    'Flax Artisan Overshirt',
    'flax-artisan-overshirt',
    'A relaxed overshirt in raw washed Belgian flax, embroidered along the sleeve vent and pocket with an architectural crest. Linen softens with wear, so the embroidery becomes part of the garment.',
    '240 GSM Woven Linen',
    'High-Relief Architectural Fill',
    31000,
    12500::numeric, 14000::numeric,
    'accessories-linen',
    array['/images/stitch/s11-luxury-still-life-of-a-relaxed-natural.jpg','/images/stitch/s08-aesthetic-portrait-of-an-artisan-tailor-wearing.jpg','/images/stitch/s48-bespoke-tailoring-closeup-of-raw-belgian-flax.jpg'],
    array['S','M','L','XL'],
    '[{"name":"Natural Flax","hex":"#d1c7b7"},{"name":"Smoked Earth","hex":"#3b342c"},{"name":"Terracotta","hex":"#8e4438"}]',
    '{"S":2,"M":4,"L":4,"XL":2}',
    12, true, false, true
  ),
  (
    'The Sculpted Six-Panel Cap',
    'sculpted-six-panel-cap',
    'A structured six-panel cap in heavy brushed twill, with crisp 3D high-rise puff embroidery on the front crown and antique brass hardware.',
    'Brushed Cotton Twill',
    '3D High-Rise Puff Embroidery',
    9400,
    2900::numeric, null::numeric,
    'structured-caps',
    array['/images/stitch/s12-editorial-product-photo-of-a-deep-forest.jpg','/images/stitch/s07-close-up-still-life-photograph-of-structured.jpg','/images/stitch/s49-artisanal-unstructured-six-panel-baseball-cap-in.jpg'],
    array['One Size'],
    '[{"name":"Forest","hex":"#27382b"},{"name":"Pitch Black","hex":"#1a1a1a"},{"name":"Sandstone","hex":"#c8b69e"}]',
    '{"One Size":18}',
    18, false, true, true
  ),
  (
    'Archival French Terry Crewneck',
    'archival-french-terry-crewneck',
    'A 420 GSM loopback French terry crewneck in oatmeal, finished with a chain-stitch monogram on the chest. The quietest piece in the collection, and the easiest to live in.',
    '420 GSM Loopback Terry',
    'Chain Stitch Monogram',
    16500,
    7400::numeric, 8600::numeric,
    'sweatshirts',
    array['/images/stitch/s29-editorial-garment-photograph-of-an-archival-french.jpg','/images/stitch/s13-photorealistic-3d-rendering-mockup-of-an-oatmeal.jpg','/images/stitch/s01-close-up-editorial-flatlay-of-an-ecru.jpg'],
    array['S','M','L','XL'],
    '[{"name":"Oatmeal","hex":"#ddd3c3"},{"name":"Raw Ecru","hex":"#e8e4da"},{"name":"Mineral Sage","hex":"#7d8a76"}]',
    '{"S":5,"M":9,"L":10,"XL":4}',
    28, false, false, true
  ),
  (
    'Custom Canvas Hoodie Blank',
    'custom-canvas-hoodie-blank',
    'A 500 GSM dense cotton canvas hoodie blank engineered specifically for your custom commission. Choose it in the studio and let the master digitizer build your motif from scratch.',
    '500 GSM Dense Canvas',
    'Ready for bespoke needlework',
    null::integer,
    4900::numeric, null::numeric,
    'heavyweight-hoodies',
    array['/images/stitch/s50-ultra-heavy-500-gsm-dense-canvas-cotton.jpg','/images/stitch/s13-photorealistic-3d-rendering-mockup-of-an-oatmeal.jpg'],
    array['S','M','L','XL','XXL'],
    '[{"name":"Parchment","hex":"#e8e2d6"},{"name":"Washed Noir","hex":"#202020"}]',
    '{"S":7,"M":11,"L":13,"XL":9,"XXL":5}',
    45, true, false, true
  )
) as v (
  name, slug, description, fabric_label, technique, stitch_count,
  price, compare_at_price, category_slug, images, sizes, colors, size_stock, stock,
  is_featured, is_new_arrival, is_customisable
)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
