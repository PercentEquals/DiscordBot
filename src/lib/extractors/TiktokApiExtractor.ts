import { validateUrl } from "../../common/validateUrl";
import { Image, TiktokApi } from "../../../types/tiktokApi";

import YoutubeDL from "../YoutubeDLProcessor";
import IExtractor, { BestFormat } from "./IExtractor";

import { DISCORD_LIMIT } from "../../constants/discordlimit";
import { getHumanReadableDuration } from "../../common/audioUtils";

export default class TiktokApiExtractor implements IExtractor {
    private tiktokApi: TiktokApi | null = null;

    public async extractUrl(url: string): Promise<boolean> {
        const urlObj = new URL(url);
        const id = validateUrl(urlObj);

        if (!urlObj.hostname.includes('tiktok')) {
            return false;
        }

        const data = await YoutubeDL(url, {
            dumpPages: true,
            skipDownload: true,
            ignoreErrors: true,
            noWarnings: true,
            //@ts-expect-error - Missing type - values from: https://github.com/yt-dlp/yt-dlp/issues/9506
            extractorArgs: "tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com;app_info=7355728856979392262"
        });

        // hack from https://github.com/dylanpdx/vxtiktok/blob/main/vxtiktok.py#L70C1-L72C66
        for (const line of (data as any).split('\n')) {
            if (line.match(/^[A-Za-z0-9+/=]+$/)) {
                const decoded = Buffer.from(line, 'base64').toString('utf-8');
                const api = JSON.parse(decoded) as TiktokApi;

                if (api.aweme_list[0].aweme_id !== id) {
                    return false;
                }

                this.tiktokApi = api;
                return true;
            }
        }

        return false;
    }

    public isSlideshow(): boolean {
        return this.getSlideshowData().length > 0;
    }

    public getSlideshowData(): string[] {
        const images = this.tiktokApi?.aweme_list[0]?.image_post_info?.images as Image[];

        if (!images) {
            return [];
        }

        return images.map(image => image.display_image.url_list.filter(
            (url) => url.includes('.webp') || url.includes('.jpeg') || url.includes('.jpg') || url.includes('.png')
        )[0] ?? image.display_image.url_list[0]);
    }

    public getId(): string {
        return this.tiktokApi?.aweme_list[0].aweme_id as string;
    }

    public getBestFormat(skipSizeCheck?: boolean): BestFormat | null {
        const videoData = this.tiktokApi?.aweme_list[0].video;

        const bestFormat = {
            url: videoData?.play_addr.url_list[videoData.play_addr.url_list.length - 1],
            filesize: videoData?.play_addr.data_size as number
        } as BestFormat;

        if (bestFormat.filesize > DISCORD_LIMIT && !skipSizeCheck) {
            return null;
        }

        return bestFormat;
    }

    public getDuration(): number {
        return this.tiktokApi?.aweme_list[0].music.duration ?? 0;
    }

    public getReplyString(): string {
        return `${this.tiktokApi?.aweme_list[0].desc.substring(0, 100)} - ${this.tiktokApi?.aweme_list[0].author.nickname} | ${getHumanReadableDuration(this.getDuration())}`;
    }
}