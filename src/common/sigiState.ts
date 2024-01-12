import { Image, TiktokApi } from "../../types/tiktokApi";
import { validateUrl } from "./validateUrl";

import youtubedl, { YtResponse } from "youtube-dl-exec";

export function getTiktokUrl(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].share_url;
}

export function getTiktokId(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].aweme_id;
}

export function getTiktokSlideshowData(tiktokApi: TiktokApi | null) {
    return tiktokApi?.aweme_list[0]?.image_post_info?.images as Image[];
}

export function getTiktokVideoData(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].video;
}

export function getTiktokAudioData(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].music;
}

export async function getDataFromYoutubeDl(url: string) {
    const urlObj = new URL(url);
    const id = validateUrl(urlObj);

    if (urlObj.hostname.includes('tiktok')) {
        const data = await youtubedl(url, {
            dumpPages: true,
            skipDownload: true,
        });
    
        // hack from https://github.com/dylanpdx/vxtiktok/blob/main/vxtiktok.py#L70C1-L72C66
        for (const line of (data as any).split('\n')) {
            if (line.match(/^[A-Za-z0-9+/=]+$/)) {
                const decoded = Buffer.from(line, 'base64').toString('utf-8');
                const api = JSON.parse(decoded) as TiktokApi;

                return {
                    tiktokApi: api,
                    ytResponse: null
                }
            }
        }
    }

    let videoData = await youtubedl(url, {
        dumpSingleJson: true,
        getFormat: true,
        noWarnings: true,
    });

    //@ts-ignore - youtube-dl-exec videoData contains useless first line
    videoData = videoData.split('\n').slice(1).join('\n');
    videoData = JSON.parse(videoData as any) as YtResponse;

    return {
        tiktokApi: null,
        ytResponse: videoData
    }
}