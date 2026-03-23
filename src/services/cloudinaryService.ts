/**
 * Cloudinary direct upload service.
 * Uploads media files directly from the app to Cloudinary (persistent storage),
 * bypassing the ephemeral Render server filesystem.
 *
 * Cloud Name:    DNPfzerwn
 * Upload Preset: qfgbchxk  (unsigned)
 */

const CLOUD_NAME = 'DNPfzerwn';
const UPLOAD_PRESET = 'qfgbchxk';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export type CloudinaryUploadResult = {
  mediaUrl: string;
  mediaType: string;
  fileName?: string;
};

/**
 * Returns the canonical mediaType string for the chat from a Cloudinary resource_type.
 * Cloudinary returns: 'image', 'video', 'raw' (for documents/audio).
 */
const resolveMediaType = (
  cloudinaryResourceType: string,
  originalMimeType?: string,
  fileName?: string
): string => {
  if (cloudinaryResourceType === 'image') return 'image';
  if (cloudinaryResourceType === 'video') {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus', 'webm'].includes(ext)) {
      return 'audio';
    }
    if (originalMimeType?.startsWith('audio/')) return 'audio';
    return 'video';
  }
  // raw — document or audio file
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus'].includes(ext)) return 'audio';
  return 'file';
};

export const cloudinaryUpload = async (file: {
  uri: string;
  name: string;
  type: string;
}): Promise<CloudinaryUploadResult> => {
  const form = new FormData();
  // @ts-expect-error React Native FormData file
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${err}`);
  }

  const data = await response.json();

  const mediaType = resolveMediaType(
    data.resource_type,
    file.type,
    file.name
  );

  return {
    mediaUrl: data.secure_url,
    mediaType,
    fileName: data.original_filename || file.name,
  };
};
