import { TiktokApi } from "../../types/tiktokApi";
import { fetchWithRetries } from "./fetchWithReplies";
import { validateUrl } from "./validateUrl";

import cheerio from "cheerio";
import youtubedl from "youtube-dl-exec";

import fs from "fs";

export async function getTiktokIdFromTiktokUrl(url: string) {
    const urlObj = new URL(url);
    const fallbackId = validateUrl(urlObj);

    try {
        const response = await fetchWithRetries(url);
        const body = await response.text();

        const $ = cheerio.load(body);
        const $ogUrl = $('meta[property="og:url"]');

        const ogUrl = $ogUrl.attr('content') as string;
        const id = ogUrl.match(/video\/(\d+)/)?.[1] as string;
        return id;
    } catch (e) {
        return fallbackId;
    }
}

export async function getSlideshowDataFromTiktokApi(url: string) {
    const urlObj = new URL(url);
    const id = validateUrl(urlObj);

    if (!urlObj.hostname.includes('tiktok')) {
        return null;
    }

    const data = await youtubedl(url, {
        dumpPages: true,
        skipDownload: true,
    });

    // hack from https://github.com/dylanpdx/vxtiktok/blob/main/vxtiktok.py#L70C1-L72C66
    for (const line of (data as any).split('\n')) {
        if (line.match(/^[A-Za-z0-9+/=]+$/)) {
            const decoded = Buffer.from(line, 'base64').toString('utf-8');
            const api = JSON.parse(decoded) as TiktokApi;

            return api.aweme_list[0].image_post_info?.images;
        }
    }

    return null;
}