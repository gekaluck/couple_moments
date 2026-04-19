export const MAX_EVENT_PHOTOS = 20;
export const MAX_EVENT_PHOTO_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const IMAGE_PATH_PATTERN = /\.(?:avif|gif|heic|jpeg|jpg|png|webp)$/i;

export function isSupportedImagePath(pathname: string) {
  return IMAGE_PATH_PATTERN.test(pathname);
}

export function isCloudinaryAssetUrl(url: URL, cloudName?: string) {
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    return false;
  }

  const normalizedPath = url.pathname.replace(/^\/+/, "");
  if (!normalizedPath) {
    return false;
  }

  if (!cloudName) {
    return true;
  }

  return normalizedPath.startsWith(`${cloudName}/`);
}
