import crypto from "crypto";
import cheerio from "cheerio";
import fs from "fs";

import IExtractor, { BestFormat } from "./IExtractor";
import { downloadFile } from "../../common/fileUtils";
import { getHumanReadableDuration } from "../../common/audioUtils";
import { DISCORD_LIMIT } from "../../constants/discordlimit";

export default class TiktokRehydrationExtractor implements IExtractor {
    private uuid = crypto.randomBytes(16).toString("hex");

    private apiData: TiktokRehydrationApi | null = null;
    private cookies: string = "";

    public async extractUrl(url: string): Promise<boolean> {
        try {
            const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
            const urlObj = new URL(url);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            let response = await fetch(url, { headers: { userAgent }});

            if (!response.ok) {
                return false;
            }

            const body = await response.text();

            this.cookies = "";
            this.cookies += response.headers.get("set-cookie")?.match(/ttwid=[^;]*; /);
            this.cookies += response.headers.get("set-cookie")?.match(/tt_csrf_token=[^;]*; /);
            this.cookies += response.headers.get("set-cookie")?.match(/tt_chain_token=[^;]*; /);
            this.cookies += response.headers.get("set-cookie")?.match(/msToken=[^;]*; /);

            const $ = cheerio.load(body);
            const $script = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
            this.apiData = JSON.parse($script.html() as string).__DEFAULT_SCOPE__["webapp.video-detail"];

            const canonicalHref = JSON.parse($script.html() as string).__DEFAULT_SCOPE__["seo.abtest"].canonical;
            const audioUrl = this.apiData?.itemInfo?.itemStruct?.music?.playUrl;

            if (!this.isSlideshow()) {
                return false;
            }

            await downloadFile(
                audioUrl as string,
                `cache/${this.getId()}`, 
                {
                    headers: {
                        "Referer": canonicalHref,
                        "User-Agent": userAgent
                    },
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
        return this.getSlideshowData().length > 0;
    }

    public getSlideshowData(): string[] {
        const images = this.apiData?.itemInfo?.itemStruct?.imagePost?.images;

        if (!images) {
            return [];
        }

        return images.map(image => image.imageURL.urlList.filter(
            (url) => url.includes('.webp') || url.includes('.jpeg') || url.includes('.jpg') || url.includes('.png')
        )[0] ?? image.imageURL.urlList[0]);
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
        let duration = this.apiData?.itemInfo.itemStruct.music.duration;

        if (!duration) {
            duration = this.apiData?.itemInfo.itemStruct.video.duration;
        }

        return duration ?? 0;
    }

    public getReplyString(): string {
        return `${this.apiData?.shareMeta.title.substring(0, 100)} - ${this.apiData?.itemInfo.itemStruct.author.nickname.substring(0, 25)} | ${getHumanReadableDuration(this.getDuration())}`;
    }

    public getData() {
        return {
            apiData: this.apiData,
            cookies: this.cookies
        }
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