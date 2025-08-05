import { getHumanReadableDuration } from "src/common/audioUtils";
import IExtractor, { BestFormat } from "./IExtractor";

let cache: Record<string, {
    isSlideshow: boolean;
    slideshowData: string[];
    bestFormat: BestFormat | null;
    bestFormatSkipSizeCheck: BestFormat | null;
    duration: number;
    replyString: string;
    apiData: any | null;
    cookies: string;
}> = {};

export default class CacheExtractor implements IExtractor {
    private id = "cache";
    private url: string = "";

    public async extractUrl(url: string): Promise<boolean> {
        this.url = url;
        return !!cache[this.url];
    }

    public getId(): string {
        return this.id;
    }

    isSlideshow(): boolean {
        return cache[this.url].isSlideshow;
    }

    getSlideshowData(): string[] {
        return cache[this.url].slideshowData;
    }

    getBestFormat(skipSizeCheck?: boolean): BestFormat | null {
        if (skipSizeCheck) {
            return cache[this.url].bestFormatSkipSizeCheck;
        }

        return cache[this.url].bestFormat;
    }

    getDuration(): number {
        return cache[this.url].duration;
    }

    getReplyString(): string {
        return cache[this.url].replyString;
    }

    provideDataExtractor?(extractor: IExtractor | null): void {
        if (extractor instanceof FileBasedExtractor) {
            return;
        }

        cache[this.url] = {
            isSlideshow: extractor?.isSlideshow() ?? false,
            slideshowData: extractor?.getSlideshowData() ?? [],
            bestFormat: extractor?.getBestFormat() ?? null,
            bestFormatSkipSizeCheck: extractor?.getBestFormat(true) ?? null,
            duration: extractor?.getDuration() ?? 0,
            replyString: extractor?.getReplyString() ?? `${this.id} | ${getHumanReadableDuration(null)}`,
            apiData: extractor?.getData?.()?.apiData ?? null,
            cookies: extractor?.getData?.()?.cookies ?? "",
        }
    }

    getData?(): { apiData: TiktokRehydrationApi | null; cookies: string; } {
        return {
            apiData: cache[this.url].apiData,
            cookies: cache[this.url].cookies,
        };
    }

    dispose?(deep: boolean): void {
        return;
    }
}