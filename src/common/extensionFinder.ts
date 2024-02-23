export function getExtensionFromUrl(url: string) {
    if (!url) return null;
    if (url.includes('.jpg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.jpeg')) return 'jpeg';
    if (url.includes('.webp')) return 'webp';
    return null;
}