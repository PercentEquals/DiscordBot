import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

export function extractUrl(text: string) {
    let url = text.match(/\bhttps?:\/\/\S+/gi)?.[0] ?? text;

    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }

    try {
        const urlObj = new URL(url);

        if (urlObj.hostname.includes('tiktok')) {
            if (urlObj.pathname.includes('/photo/')) {
                urlObj.pathname = urlObj.pathname.replace('/photo/', '/video/');
            }
        }

        if (urlObj.hostname.startsWith('vx')) {
            urlObj.hostname = urlObj.hostname.replace('vx', '');
        }

        return urlObj.toString() ?? url;
    } catch (e) {
        return url;
    }
}

export function validateUrl(url: URL | string) {
    if (typeof url === 'string') {
        url = new URL(url);
    }

    if (!ALLOWED_YTD_HOSTS.includes(url.hostname)) {
        const allowedUrlsString = JSON.stringify(ALLOWED_YTD_HOSTS)
            .replace('[', '')
            .replace(']', '')
            .replace(/,/g, ', ')
            .replace(/"/g, '');

        throw new Error(`Not an allowed url:\n${allowedUrlsString}`);
    }

    const urlNoParams = url.href.split('?')[0];
    let id = urlNoParams.split('/')[urlNoParams.split('/').length - 1];
    if (id === '') {
        id = urlNoParams.split('/')[urlNoParams.split('/').length - 2];
    }

    if (!id && url.hostname.includes('youtube')) {
        id = url.searchParams.get('v') as string;
    }

    if (!id) {
        throw new Error('No id found');
    }

    return id;
}