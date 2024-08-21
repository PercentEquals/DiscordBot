import crypto from "crypto";
import fs from "fs";

import IExtractor, { BestFormat } from "./IExtractor";
import { getHumanReadableDuration } from "src/common/audioUtils";
import { DISCORD_LIMIT } from "src/constants/discordlimit";
import logger from "src/logger";

export default abstract class FileBasedExtractor implements IExtractor {
    protected uuid = crypto.randomBytes(16).toString("hex");
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
            logger.warn(e);
        }
    }

    public provideDataExtractor(extractor: IExtractor | null): void {
        this.dataExtractor = extractor;
    }
}