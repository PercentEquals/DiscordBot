import { Image } from "types/tiktokApi";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { YtResponse } from "youtube-dl-exec";

export function getBestFormat(url: string, ytResponse: YtResponse, audioOnly: boolean): { url: string, filesize: number } | null {
    let bestFormat: { url: string, filesize: number } | null = null;

    if (new URL(url).hostname.includes('tiktok')) {
        //@ts-ignore - tiktok slideshow audio edge case
        const tiktokSlideshowAudio = ytResponse.requested_downloads?.[0];

        const formatsNoWatermark = ytResponse.formats.filter((format) => format.format_note && !format.format_note.includes('watermark'));
        const formatsUnderLimit = formatsNoWatermark?.filter((format) => format.filesize && format.filesize < DISCORD_LIMIT);
        const formatsH264 = formatsUnderLimit?.filter((format) => format.format.includes('h264'));

        if (formatsH264.length === 0 && tiktokSlideshowAudio && audioOnly) {
            formatsH264.push(tiktokSlideshowAudio);
        }

        bestFormat = formatsH264.sort((a, b) => a.filesize - b.filesize)?.[0];
    } else if (new URL(url).hostname.includes('youtube')) {
        //@ts-ignore - youtube-dl-exec types don't include filesize_approx
        const formatsUnderLimit = ytResponse.formats.filter((format) => format.filesize < DISCORD_LIMIT || format.filesize_approx < DISCORD_LIMIT);
        const formats = formatsUnderLimit.filter((format) => format.acodec && format.vcodec && format.acodec.includes('mp4a') && format.vcodec.includes('avc'));
        bestFormat = formats.sort((a, b) => a.filesize - b.filesize)?.[0];
    } else if (new URL(url).hostname.includes('discordapp')) {
        bestFormat = ytResponse.formats[0];
    }

    return bestFormat;
}

export function getBestImageUrl(imageData: Image) {
    return imageData.display_image.url_list.filter(
        (url) => url.includes('webp') || url.includes('jpeg') || url.includes('jpg') || url.includes('png')
    )[0] ?? imageData.display_image.url_list[0];
}