import crypto from "crypto";
import fs from "fs";

import { validateUrl } from "../../common/validateUrl";
import IExtractor, { BestFormat } from "./IExtractor";

import { getHumanReadableDuration } from "../../common/audioUtils";
import { downloadFile } from "../../common/fileUtils";

import { DISCORD_LIMIT } from "../../constants/discordlimit";

export default class TiktokThirdPartyExtractor implements IExtractor {
    private uuid = crypto.randomBytes(16).toString("hex");
    private id: string = "";

    private dataExtractor: IExtractor | null = null;

    constructor(
        private thirdPartyUrlProvider: (url: string) => Promise<string>
    ) {}

    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            this.id = validateUrl(urlObj);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            await downloadFile(
                await this.thirdPartyUrlProvider(url),
                `cache/${this.getId()}`
            )

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

    public dispose() {
        try {
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