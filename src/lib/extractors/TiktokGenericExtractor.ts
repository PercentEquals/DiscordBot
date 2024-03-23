import crypto from "crypto";

import youtubedl from "youtube-dl-exec";
import IExtractor, { BestFormat } from "./IExtractor";

import { getHumanReadableDuration } from "../../common/audioUtils";

import fs from "fs";

export default class TiktokGenericExtractor implements IExtractor {
    private uuid = crypto.randomBytes(16).toString("hex");

    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            await youtubedl(url, {
                ignoreErrors: true,
                noWarnings: true,
                format: "0",
                output: `cache/${this.getId()}`
            });

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
            return {
                url: `cache/${this.getId()}`,
                filesize: fs.lstatSync(`cache/${this.getId()}`).size
            }
        }

        return null;
    }

    public getDuration(): number {
        return 0;
    }

    public getReplyString(): string {
        return `${this.getId()} | ${getHumanReadableDuration(null)}`;
    }

    public dispose() {
        try {
            if (fs.existsSync(`cache/${this.getId()}`)) {
                fs.unlinkSync(`cache/${this.getId()}`);
            }
        } catch(e) {
            console.warn(e);
        }
    }
}