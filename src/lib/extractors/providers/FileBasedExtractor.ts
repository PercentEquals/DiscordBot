import fs from "fs";

import IExtractor from "./IExtractor";
import { getHumanReadableDuration } from "src/common/audioUtils";
import { DISCORD_LIMIT } from "src/constants/discordlimit";
import logger from "src/logger";
import { GUID } from "src/lib/utils/Guid";

export default abstract class FileBasedExtractor implements IExtractor {
    protected uuid = GUID();
    protected id = "";

    protected dataExtractor: IExtractor | null = null;

    public abstract extractUrl(url: string): Promise<boolean>;

    public isSlideshow(): boolean {
        return false;
    }

    public getSlideshowData(): string[] {
        throw new Error("Method not supported.");
    }

    public getId(): string {
        return this.uuid;
    }

    public getBestFormat(skipSizeCheck?: boolean) {
        if (!fs.existsSync(this.getCacheFileName())) {
            return null;
        }

        const filesize = fs.lstatSync(this.getCacheFileName()).size;

        if (filesize > DISCORD_LIMIT && !skipSizeCheck) {
            return null;
        }

        return {
            url: this.getCacheFileName(),
            filesize
        };
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

            if (fs.existsSync(this.getCacheFileName())) {
                fs.unlinkSync(this.getCacheFileName());
            }
        } catch(e) {
            logger.warn(e);
        }
    }

    public provideDataExtractor(extractor: IExtractor | null): void {
        this.dataExtractor = extractor;
    }

    protected getCacheFileName() {
        return `cache/${this.getId()}`;
    }
}