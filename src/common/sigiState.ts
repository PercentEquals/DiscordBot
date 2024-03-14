import logger from "../logger";

import { Image, TiktokApi } from "../../types/tiktokApi";
import { validateUrl } from "./validateUrl";

import youtubedl, { YtResponse } from "youtube-dl-exec";

export function getTiktokId(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].aweme_id;
}

export function getTiktokSlideshowData(tiktokApi: TiktokApi | null | undefined) {
    return tiktokApi?.aweme_list[0]?.image_post_info?.images as Image[];
}

export function getTiktokVideoData(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].video;
}

export function getTiktokAudioData(tiktokApi: TiktokApi) {
    return tiktokApi.aweme_list[0].music;
}

export type YoutubeDlData = {
    tiktokApi?: TiktokApi | null
    ytResponse?: YtResponse | null
}

export async function getDataFromYoutubeDl(url: string): Promise<YoutubeDlData> {
    try {
        logger.info('[youtube-dl] getting video/audio data');
        const urlObj = new URL(url);
        const id = validateUrl(urlObj);

        try {
            if (urlObj.hostname.includes('tiktok')) {
                const data = await youtubedl(url, {
                    dumpPages: true,
                    skipDownload: true,
                    ignoreErrors: true,
                    noWarnings: true,
                    //@ts-expect-error - Missing type - This is a temporary fix until youtube-dl fixes https://github.com/yt-dlp/yt-dlp/issues/9441
                    extractorArgs: "tiktok:api_hostname=api22-normal-c-useast2a.tiktokv.com"
                });
            
                // hack from https://github.com/dylanpdx/vxtiktok/blob/main/vxtiktok.py#L70C1-L72C66
                for (const line of (data as any).split('\n')) {
                    if (line.match(/^[A-Za-z0-9+/=]+$/)) {
                        const decoded = Buffer.from(line, 'base64').toString('utf-8');
                        const api = JSON.parse(decoded) as TiktokApi;

                        if (api.aweme_list[0].aweme_id !== id) {
                            throw new Error('Could not find tiktok data for provided url!');
                        }

                        logger.info('[youtube-dl] video/audio data retrieved');
                        return {
                            tiktokApi: api,
                            ytResponse: null
                        }
                    }
                }
            }
        } catch (e) {
            logger.error(e);
        }

        let videoData = await youtubedl(url, {
            dumpSingleJson: true,
            getFormat: true,
            noWarnings: true,
            skipDownload: true,
        });

        //@ts-ignore - youtube-dl-exec videoData contains useless first line
        videoData = videoData.split('\n').slice(1).join('\n');
        videoData = JSON.parse(videoData as any) as YtResponse;

        logger.info('[youtube-dl] video/audio data retrieved');
        return {
            tiktokApi: null,
            ytResponse: videoData
        }
    } catch (e) {
        logger.error(e);
        throw new Error('No data for provided url found!');
    }
}