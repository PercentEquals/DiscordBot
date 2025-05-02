import { validateUrl } from "src/common/validateUrl";
import fs from "fs";

import YoutubeDL, { ApiData } from "src/lib/yt-dlp/YoutubeDLProcess";

import { DISCORD_LIMIT } from "src/constants/discordlimit";
import { getHumanReadableDuration } from "src/common/audioUtils";
import { Format } from "youtube-dl-exec";
import IExtractor from "./IExtractor";
import { GUID } from "src/lib/utils/Guid";

export default class GenericExtractor implements IExtractor {
    private id: string = GUID();
    private url: string = "";
    private apiData: ApiData | null = null;

    constructor(
        private formatFinders = [
            VideoFormatFinder,
            TwitterFormatFinder,
            DiscordFormatFinder,
            InstagramFormatFinder,
        ]
    ) {}

    isSlideshow(): boolean {
        return false;
    }

    getSlideshowData(): string[] {
        return [];
    }

    getId(): string {
        return this.id;
    }

    public provideDataExtractor(extractor: IExtractor | null): void {
        return;
    }

    public async extractUrl(url: string): Promise<boolean> {
        const urlObj = new URL(url);

        validateUrl(urlObj);
        this.url = url;

        if (urlObj.hostname.includes('tiktok')) {
            return false;
        }

        let videoData = await YoutubeDL(url, {
            dumpSingleJson: true,
            getFormat: true,
            noWarnings: true,
            skipDownload: true,
            noPlaylist: true,
        })

        videoData = (videoData as any).split('\n').slice(1).join('\n');
        this.apiData = JSON.parse(videoData as any) as ApiData;

        return true;
    }

    public getBestFormat(skipSizeCheck?: boolean) {
        let formats = this.apiData?.formats.filter(
            (format) => (format.filesize as number) < DISCORD_LIMIT || (format.filesize_approx as number) < DISCORD_LIMIT
        );

        if (skipSizeCheck) {
            formats = this.apiData?.formats;
        }

        //fs.writeFileSync(`cache/${this.getId()}.json`, JSON.stringify(this.apiData, null, 2));
        const urlObj = new URL(this.url); 

        for (const formatFinder of this.formatFinders) {
            const foundFormats = formatFinder.findBestFormat(urlObj.hostname, formats);

            if (foundFormats && foundFormats.length > 0) {
                formats = foundFormats;
                break;
            }
        }

        let bestFormat = formats?.sort((a, b) => (a.filesize as number) - (b.filesize as number))?.[0];

        if (!bestFormat) {
            return null;
        }

        if (bestFormat.filesize == null && !!bestFormat.filesize_approx) {
            bestFormat.filesize = bestFormat?.filesize_approx;
        }

        return {
            url: bestFormat.url,
            filesize: bestFormat.filesize as number
        }
    }

    public getDuration(): number {
        return this.apiData?.duration ?? 0;
    }

    public getReplyString(): string {
        return `${this.apiData?.title.substring(0, 100)} - ${this.apiData?.uploader ?? "unknown"} | ${getHumanReadableDuration(this.getDuration())}`;
    }
}

class TwitterFormatFinder {
    public static findBestFormat(hostname: string, formats: Format[] | undefined): Format[] | null {
        if (formats && (hostname.includes("twitter") || hostname == "x.com")) {
            return formats.filter(
                (format) => (format.video_ext && format.video_ext.includes('mp4'))
            );
        }

        return null;
    }
}

class DiscordFormatFinder {
    public static findBestFormat(hostname: string, formats: Format[] | undefined): Format[] | null {
        if (formats && hostname.includes("discord")) {
            return [formats[0]]
        }

        return null;
    }
}

class InstagramFormatFinder {
    public static findBestFormat(hostname: string, formats: Format[] | undefined): Format[] | null {
        if (formats && hostname.includes("instagram")) {
            return formats.filter(
                (format) => (format.video_ext && format.video_ext.includes('mp4'))
            );
        }

        return null;
    }
}

class VideoFormatFinder {
    public static findBestFormat(hostname: string, formats: Format[] | undefined): Format[] | null {
        return formats?.filter(
            (format) => format.acodec && format.vcodec && format.acodec.includes('mp4a') && format.vcodec.includes('avc')
        ) ?? null;
    }
}