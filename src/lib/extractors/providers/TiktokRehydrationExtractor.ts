import fs from "fs";

import { downloadFile } from "src/common/fileUtils";
import { getHumanReadableDuration } from "src/common/audioUtils";
import FileBasedExtractor from "./FileBasedExtractor";

import { parse } from 'node-html-parser';

export default class TiktokRehydrationExtractor extends FileBasedExtractor {
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

            this.cookies = "";
            this.cookies += response.headers.get("set-cookie")?.match(/ttwid=[^;]*; /);
            this.cookies += response.headers.get("set-cookie")?.match(/tt_csrf_token=[^;]*; /);
            this.cookies += response.headers.get("set-cookie")?.match(/tt_chain_token=[^;]*; /);

            const body = await response.text();
            const dom = parse(body);
            const script = dom.querySelector('#__UNIVERSAL_DATA_FOR_REHYDRATION__');

            this.apiData = JSON.parse(script?.innerHTML!).__DEFAULT_SCOPE__["webapp.video-detail"];

            const canonicalHref = JSON.parse(script?.innerHTML!).__DEFAULT_SCOPE__["seo.abtest"].canonical;
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

            return fs.existsSync(`cache/${this.getId()}`);
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

    public getDuration(): number {
        let duration = this.apiData?.itemInfo?.itemStruct?.music?.duration;

        if (!duration) {
            duration = this.apiData?.itemInfo?.itemStruct?.video?.duration;
        }

        return duration ?? 0;
    }

    public getReplyString(): string {
        return `${this.apiData?.shareMeta?.title?.substring(0, 100)} - ${this.apiData?.itemInfo?.itemStruct?.author?.nickname?.substring(0, 25)} | ${getHumanReadableDuration(this.getDuration())}`;
    }

    public getData() {
        return {
            apiData: this.apiData,
            cookies: this.cookies
        }
    }
}