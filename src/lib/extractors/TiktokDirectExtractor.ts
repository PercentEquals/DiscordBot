import crypto from "crypto";
import fs from "fs";

import IExtractor, { BestFormat } from "./IExtractor";

import { getHumanReadableDuration } from "../../common/audioUtils";
import { DISCORD_LIMIT } from "../../constants/discordlimit";
import { validateUrl } from "src/common/validateUrl";
import { downloadFile } from "src/common/fileUtils";

export default class TiktokDirectExtractor implements IExtractor {
    private uuid = crypto.randomBytes(16).toString("hex");
    private id: string = "";

    private dataExtractor: IExtractor | null = null;

    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            this.id = validateUrl(url);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            const data = this.dataExtractor?.getData?.();
            const apiData = data?.apiData;

            if (!apiData) {
                return false;
            }

            const videoInfo = apiData.itemInfo.itemStruct.video;
            const downloadAddr = videoInfo.downloadAddr;

            await downloadFile(
                downloadAddr,
                `cache/${this.getId()}`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Sec-Fetch-Mode": "navigate",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Cookie": data.cookies
                    },
                    credentials: "include",
                    method: "GET"
                }
            );

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