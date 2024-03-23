import { validateUrl } from "../../common/validateUrl";

import youtubedl, { Payload } from "youtube-dl-exec";
import IExtractor, { BestFormat } from "./IExtractor";

import { DISCORD_LIMIT } from "../../constants/discordlimit";
import { getHumanReadableDuration } from "../../common/audioUtils";

export default class GenericExtractor implements IExtractor {
    private apiData: Payload | null = null;
    private id: string = "";

    public async extractUrl(url: string): Promise<boolean> {
        const urlObj = new URL(url);
        this.id = validateUrl(urlObj);

        let videoData = await youtubedl(url, {
            dumpSingleJson: true,
            getFormat: true,
            noWarnings: true,
            skipDownload: true,
        });

        //@ts-ignore - youtube-dl-exec videoData contains useless first line
        videoData = videoData.split('\n').slice(1).join('\n');
        videoData = JSON.parse(videoData as any) as Payload;

        this.apiData = videoData;
        return true;
    }

    public isSlideshow(): boolean {
        return false;
    }

    public getSlideshowData(): string[] {
        throw new Error("Method not supported.");
    }

    public getId(): string {
        return this.id;
    }

    public getBestFormat(skipSizeCheck?: boolean): BestFormat | null {
        let formatsUnderLimit = this.apiData?.formats.filter(
            (format) => (format.filesize as number) < DISCORD_LIMIT || (format.filesize_approx as number) < DISCORD_LIMIT
        );

        if (skipSizeCheck) {
            formatsUnderLimit = this.apiData?.formats;
        }

        const formats = formatsUnderLimit?.filter(
            (format) => format.acodec && format.vcodec && format.acodec.includes('mp4a') && format.vcodec.includes('avc')
        );
        let bestFormat = formats?.sort((a, b) => (a.filesize as number) - (b.filesize as number))?.[0] ?? this.apiData?.formats[0];

        if (bestFormat?.filesize == null && !!bestFormat?.filesize_approx) {
            bestFormat.filesize = bestFormat?.filesize_approx;
        }

        return {
            url: bestFormat?.url as string,
            filesize: bestFormat?.filesize as number
        }
    }

    public getDuration(): number {
        return this.apiData?.duration ?? 0;
    }

    public getReplyString(): string {
        return `${this.apiData?.title.substring(0, 100)} - ${this.apiData?.uploader ?? "unknown"} | ${getHumanReadableDuration(this.getDuration())}`;
    }
}