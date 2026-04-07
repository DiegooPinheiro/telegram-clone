/**
 * Cloudinary direct upload service.
 * Uploads media files directly from the app to Cloudinary (persistent storage),
 * bypassing the ephemeral Render server filesystem.
 */
import * as FileSystem from 'expo-file-system/legacy';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = process.env.EXPO_PUBLIC_CLOUDINARY_API_URL || `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

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

export const cloudinaryUpload = async (
  file: {
    uri: string;
    name: string;
    type: string;
  },
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadTask = FileSystem.createUploadTask(
      UPLOAD_URL,
      file.uri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: file.type || 'application/octet-stream',
        parameters: {
          upload_preset: UPLOAD_PRESET || '',
        },
      },
      (data) => {
        if (onProgress && data.totalBytesExpectedToSend > 0) {
          const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
          onProgress(progress);
        }
      }
    );

    uploadTask
      .uploadAsync()
      .then((response) => {
        if (!response || response.status < 200 || response.status > 299) {
          console.error('[Cloudinary] Erro bruto no upload:', response?.body);
          reject(new Error(`Cloudinary upload failed: ${response?.status} ${response?.body}`));
          return;
        }

        const parsed = JSON.parse(response.body);
        const mediaType = resolveMediaType(parsed.resource_type, file.type, file.name);

        resolve({
          mediaUrl: parsed.secure_url,
          mediaType,
          fileName: parsed.original_filename || file.name,
        });
      })
      .catch((err) => {
        console.error('[Cloudinary] Excecao na task de upload:', err);
        reject(err);
      });
  });
};
