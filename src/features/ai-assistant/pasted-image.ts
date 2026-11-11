import type { FileUIPart } from 'ai';
import { log } from '../../shared/lib/logger';

const MODULE = 'AiAssistant';
// Anthropic and OpenAI both reject images over ~5 MB, and every image rides along as base64 in the request.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_MESSAGE = 4;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** The images in a paste, as file parts ready to send; oversized ones are skipped. */
export async function readPastedImages(clipboardData: DataTransfer): Promise<FileUIPart[]> {
  const imageFiles = Array.from(clipboardData.files).filter(file => file.type.startsWith('image/'));
  const acceptedFiles = imageFiles.filter(file => file.size <= MAX_IMAGE_BYTES);
  if (acceptedFiles.length < imageFiles.length) {
    log('warn', MODULE, 'Pasted image skipped for size', { maxBytes: MAX_IMAGE_BYTES, skipped: imageFiles.length - acceptedFiles.length });
  }
  return Promise.all(acceptedFiles.map(async file => ({
    type: 'file' as const,
    mediaType: file.type,
    filename: file.name,
    url: await readAsDataUrl(file),
  })));
}
