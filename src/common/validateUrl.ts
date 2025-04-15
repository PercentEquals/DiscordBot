import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

async function getTiktokCanonicalUrl(url: string) {
    try {
        const data = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        let text = await data.text();
        text = text.replace(/\\u002F/g, '/');
        const match = text.match(/{"canonical":"(https:\/\/www.tiktok.com\/[^"]+)"/);

        if (!match) {
            return url;
        }

        return match[1];
    } catch (e) {
        return url;
    }
}

export async function extractUrl(text: string) {
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

        if (urlObj.hostname.includes('vm.tiktok.com')) {
            const canonicalUrl = await getTiktokCanonicalUrl(url);

            if (canonicalUrl !== url) {
                return extractUrl(canonicalUrl);
            }
        }

        urlObj.searchParams.delete('list')

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