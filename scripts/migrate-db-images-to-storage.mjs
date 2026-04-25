import { createClient } from '@supabase/supabase-js';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const AVATAR_IMAGES_BUCKET = 'avatars';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan SUPABASE_URL/VITE_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

function getImageExtension(contentType) {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

async function uploadDataUrlToBucket({ bucket, ownerId, dataUrl, prefix }) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('No se pudo parsear una imagen base64 para subirla a Storage.');
  }

  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';
  const extension = getImageExtension(contentType);
  const path = `${ownerId}/${prefix}-${crypto.randomUUID()}.${extension}`;

  const arrayBuffer = await blob.arrayBuffer();
  const { error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(path, Buffer.from(arrayBuffer), {
      contentType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function migrateProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, supplier_id, image_url, image_urls')
    .order('created_at', { ascending: false });

  if (error) throw error;

  let migratedCount = 0;

  for (const product of products ?? []) {
    const currentUrls = Array.isArray(product.image_urls) ? product.image_urls.filter(Boolean) : [];
    const hasBase64Images = isDataUrl(product.image_url) || currentUrls.some(isDataUrl);
    if (!hasBase64Images) continue;

    const sourceUrls = currentUrls.length ? currentUrls : [product.image_url].filter(Boolean);
    const storedUrls = [];

    for (let index = 0; index < sourceUrls.length; index += 1) {
      const imageUrl = sourceUrls[index];
      if (isDataUrl(imageUrl)) {
        storedUrls.push(await uploadDataUrlToBucket({
          bucket: PRODUCT_IMAGES_BUCKET,
          ownerId: product.supplier_id,
          dataUrl: imageUrl,
          prefix: `product-${product.id}-${index + 1}`,
        }));
      } else {
        storedUrls.push(imageUrl);
      }
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        image_url: storedUrls[0] ?? null,
        image_urls: storedUrls,
      })
      .eq('id', product.id);

    if (updateError) throw updateError;
    migratedCount += 1;
  }

  return migratedCount;
}

async function migrateAvatars() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, avatar_url')
    .not('avatar_url', 'is', null);

  if (error) throw error;

  let migratedCount = 0;

  for (const user of users ?? []) {
    if (!isDataUrl(user.avatar_url)) continue;

    const publicUrl = await uploadDataUrlToBucket({
      bucket: AVATAR_IMAGES_BUCKET,
      ownerId: user.id,
      dataUrl: user.avatar_url,
      prefix: 'avatar',
    });

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) throw updateError;
    migratedCount += 1;
  }

  return migratedCount;
}

async function main() {
  const productCount = await migrateProducts();
  const avatarCount = await migrateAvatars();

  console.log(`Productos migrados a Storage: ${productCount}`);
  console.log(`Avatares migrados a Storage: ${avatarCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
