import { Image, TiktokApi } from "types/tiktokApi";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { YtResponse } from "youtube-dl-exec";
import { YoutubeDlData, getTiktokVideoData } from "./sigiState";

export function getAnyFormat(ytData: YoutubeDlData): { url: string, filesize: number } | null {
    if (!!ytData.ytResponse) {
        return ytData.ytResponse.formats[0];
    } else if (!!ytData.tiktokApi) {
        const videoData = getTiktokVideoData(ytData.tiktokApi);

        return {
            url: videoData.play_addr.url_list[0],
            filesize: videoData.play_addr.data_size as number
        }
    }

    return null;
}

export function getBestFormat(url: string, ytData: YoutubeDlData): { url: string, filesize: number } | null {
    let bestFormat: { url: string, filesize: number } | null = null;

    if (!!ytData.tiktokApi && new URL(url).hostname.includes('tiktok')) {
        const videoData = getTiktokVideoData(ytData.tiktokApi);
        bestFormat = {
            url: videoData.play_addr.url_list[videoData.play_addr.url_list.length - 1],
            filesize: videoData.play_addr.data_size as number
        }

        if (bestFormat.filesize > DISCORD_LIMIT) {
            return null;
        }
    } else if (!!ytData.ytResponse && new URL(url).hostname.includes('youtube')) {
        //@ts-ignore - youtube-dl-exec types don't include filesize_approx
        const formatsUnderLimit = ytData.ytResponse.formats.filter((format) => format.filesize < DISCORD_LIMIT || format.filesize_approx < DISCORD_LIMIT);
        const formats = formatsUnderLimit.filter((format) => format.acodec && format.vcodec && format.acodec.includes('mp4a') && format.vcodec.includes('avc'));
        bestFormat = formats.sort((a, b) => a.filesize - b.filesize)?.[0];
    } else if (!!ytData.ytResponse && new URL(url).hostname.includes('discordapp')) {
        bestFormat = ytData.ytResponse.formats[0];
    }

    return bestFormat;
}

export function getBestImageUrl(imageData: Image) {
    return imageData.display_image.url_list.filter(
        (url) => url.includes('.webp') || url.includes('.jpeg') || url.includes('.jpg') || url.includes('.png')
    )[0] ?? imageData.display_image.url_list[0];
}