import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

export function validateUrl(url: URL) {
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