import { validateUrl } from "../../common/validateUrl";
import IExtractor, { BestFormat } from "./IExtractor";

import { getHumanReadableDuration } from "../../common/audioUtils";

export default class TiktokThirdPartyExtractor implements IExtractor {
    private id: string = "";

    public async extractUrl(url: string): Promise<boolean> {
        const urlObj = new URL(url);
        this.id = validateUrl(urlObj);

        if (!urlObj.hostname.includes('tiktok')) {
            return false;
        }

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
        return {
            url: `https://tikcdn.io/ssstik/${this.getId()}`,
            filesize: 0
        }
    }

    public getDuration(): number {
        return 0;
    }

    public getReplyString(): string {
        return `${this.getId()} | ${getHumanReadableDuration(null)}`;
    }
}