import crypto from "crypto";
import fs from "fs";

import YoutubeDL from "../YoutubeDLProcessor";
import { Flags } from "youtube-dl-exec";
import IExtractor, { BestFormat } from "./IExtractor";

import { getHumanReadableDuration } from "../../common/audioUtils";
import { DISCORD_LIMIT } from "../../constants/discordlimit";
import { validateUrl } from "src/common/validateUrl";

export default class TiktokGenericExtractor implements IExtractor {
    private uuid = crypto.randomBytes(16).toString("hex");
    private id: string = "";

    private dataExtractor: IExtractor | null = null;

    constructor(
        private format?: string | null
    ) {}

    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            this.id = validateUrl(url);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            const options = {
                output: `cache/${this.getId()}`,
                useExtractors: "TikTok"
            } as Flags;

            if (this.format) {
                options.format = this.format;
            }

            await YoutubeDL(url, options);

            if (!fs.existsSync(`cache/${this.getId()}`)) {
                return false;
            }

            return true;
        } catch (e) {
            this.dispose();
            throw e;
        }
    }

    public isSlideshow(): boolean {
        return false;
    }

    public getSlideshowData(): string[] {
        throw new Error("Method not supported.");
    }

    public getId(): string {
        return this.uuid;
    }

    public getBestFormat(skipSizeCheck?: boolean): BestFormat | null {
        if (fs.existsSync(`cache/${this.getId()}`)) {
            const filesize = fs.lstatSync(`cache/${this.getId()}`).size;

            if (filesize > DISCORD_LIMIT && !skipSizeCheck) {
                return null;
            }

            return {
                url: `cache/${this.getId()}`,
                filesize
            }
        }

        return null;
    }

    public getDuration(): number {
        if (this.dataExtractor) {
            return this.dataExtractor.getDuration();
        }

        return 0;
    }

    public getReplyString(): string {
        if (this.dataExtractor) {
            return this.dataExtractor.getReplyString();
        }

        return `${this.id} | ${getHumanReadableDuration(null)}`;
    }

    public dispose(deep = true) {
        try {
            if (deep) {
                this.dataExtractor?.dispose?.(deep);
            }

            if (fs.existsSync(`cache/${this.getId()}`)) {
                fs.unlinkSync(`cache/${this.getId()}`);
            }
        } catch(e) {
            console.warn(e);
        }
    }

    public provideDataExtractor(extractor: IExtractor | null): void {
        this.dataExtractor = extractor;
    }
}