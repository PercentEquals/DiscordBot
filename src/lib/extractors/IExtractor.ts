export type BestFormat = {
    url: string,
    filesize: number
}

export default interface IExtractor {
    extractUrl(url: string): Promise<boolean>;
    isSlideshow(): boolean;
    getSlideshowData(): string[];
    getId(): string;
    getBestFormat(skipSizeCheck?: boolean): BestFormat | null;
    getDuration(): number;
    getReplyString(): string;
}