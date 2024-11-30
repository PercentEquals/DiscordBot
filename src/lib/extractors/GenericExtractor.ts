import { validateUrl } from "../../common/validateUrl";

import YoutubeDL, { ApiData } from "../YoutubeDLProcessor";

import IExtractor, { BestFormat } from "./IExtractor";

import { DISCORD_LIMIT } from "../../constants/discordlimit";
import { getHumanReadableDuration } from "../../common/audioUtils";
import { Format } from "youtube-dl-exec";
import FileBasedExtractor from "./FileBasedExtractor";
import fs from "fs";

export default class GenericExtractor extends FileBasedExtractor {
    private url: string = "";
    private apiData: ApiData | null = null;

    public async extractUrl(url: string): Promise<boolean> {
        const urlObj = new URL(url);

        this.id = validateUrl(urlObj);
        this.url = url;

        if (urlObj.hostname.includes('tiktok')) {
            return false;
        }

        let videoData = await YoutubeDL(url, {
            dumpSingleJson: true,
            getFormat: true,
            noWarnings: true,
            skipDownload: true
        });

        //@ts-ignore - youtube-dl-exec videoData contains useless first line
        videoData = videoData.split('\n').slice(1).join('\n');
        videoData = JSON.parse(videoData as any) as ApiData;

        this.apiData = videoData;
        return true;
    }

    public override getBestFormat(skipSizeCheck?: boolean) {
        let formatsUnderLimit = this.apiData?.formats.filter(
            (format) => (format.filesize as number) < DISCORD_LIMIT || (format.filesize_approx as number) < DISCORD_LIMIT
        );

        if (skipSizeCheck) {
            formatsUnderLimit = this.apiData?.formats;
        }

        let formats = formatsUnderLimit?.filter(
            (format) => format.acodec && format.vcodec && format.acodec.includes('mp4a') && format.vcodec.includes('avc')
        );

        const urlObj = new URL(this.url);

        if (urlObj.hostname.includes("twitter") || urlObj.hostname == "x.com") {
            formats = formatsUnderLimit?.filter(
                (format) => (format.video_ext && format.video_ext.includes('mp4'))
            );
        } else if (urlObj.hostname.includes("discord")) {
            formats = [this.apiData?.formats[0] as Format];
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

    public override getDuration(): number {
        return this.apiData?.duration ?? 0;
    }

    public override getReplyString(): string {
        return `${this.apiData?.title.substring(0, 100)} - ${this.apiData?.uploader ?? "unknown"} | ${getHumanReadableDuration(this.getDuration())}`;
    }
}