import crypto from "crypto";

import { validateUrl } from "../../common/validateUrl";

import youtubedl from "youtube-dl-exec";
import IExtractor, { BestFormat } from "./IExtractor";

import { getHumanReadableDuration } from "../../common/audioUtils";

import fs from "fs";

export default class TiktokGenericExtractor implements IExtractor {
    private uuid = crypto.randomBytes(16).toString("hex");

    public async extractUrl(url: string): Promise<boolean> {
        const urlObj = new URL(url);
        validateUrl(urlObj);

        if (!urlObj.hostname.includes('tiktok')) {
            return false;
        }

        await youtubedl(url, {
            ignoreErrors: true,
            noWarnings: true,
            format: "0",
            output: `cache/${this.getId()}`
        });

        return true;
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
        return {
            url: `cache/${this.getId()}`,
            filesize: fs.lstatSync(`cache/${this.getId()}`).size
        }
    }

    public getDuration(): number {
        return 0;
    }

    public getReplyString(): string {
        return `${this.getId()} | ${getHumanReadableDuration(null)}`;
    }

    public dispose() {
        if (fs.existsSync(`cache/${this.getId()}`)) {
            fs.unlinkSync(`cache/${this.getId()}`);
        }
    }
}