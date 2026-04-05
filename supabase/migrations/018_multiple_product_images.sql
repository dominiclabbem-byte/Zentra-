-- Add an array of image URLs to products to support up to 4 images
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
