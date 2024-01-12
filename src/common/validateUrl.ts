import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

export function extractUrl(text: string) {
    const url = text.match(/\bhttps?:\/\/\S+/gi)?.[0];
    return url ?? text;
}

export function validateUrl(url: URL | string) {
    if (typeof url === 'string') {
        url = new URL(url);
    }

    if (!ALLOWED_YTD_HOSTS.includes(url.hostname)) {
        throw new Error(`Not an allowed url ${JSON.stringify(ALLOWED_YTD_HOSTS)}`);
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