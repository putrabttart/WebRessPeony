export function productImageUrl(path: string | null | undefined, assetBase: string) {
  if (!path) return null;
  try {
    const url = new URL(path);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return `${assetBase}${path}`;
  }
}
