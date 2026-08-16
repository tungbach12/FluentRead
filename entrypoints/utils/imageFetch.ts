export const MAX_REMOTE_IMAGE_BYTES = 16 * 1024 * 1024;

export function normalizeRemoteImageUrl(source: string): string {
    let url: URL;
    try {
        url = new URL(source);
    } catch {
        throw new Error('Invalid image URL');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Only web image URLs are supported');
    }

    return url.href;
}

export function imageBufferToDataUrl(buffer: ArrayBuffer, contentType: string): string {
    if (buffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
        throw new Error('Image file is too large');
    }

    const mimeType = contentType.split(';', 1)[0]?.trim().toLowerCase();
    if (!mimeType?.startsWith('image/')) {
        throw new Error('The remote URL is not an image');
    }

    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return `data:${mimeType};base64,${btoa(binary)}`;
}
