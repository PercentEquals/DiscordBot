import logger from "../../logger";

import async from "async";

import YoutubeDL from "../yt-dlp/YoutubeDLProcess";

import IExtractor from "./providers/IExtractor";
import TiktokGenericExtractor from "./providers/TiktokGenericExtractor";
import TiktokRehydrationExtractor from "./providers/TiktokRehydrationExtractor";
import GenericExtractor from "./providers/GenericExtractor";
import TiktokDirectExtractor from "./providers/TiktokDirectExtractor";

import performance from "../utils/Performance";
import { MAX_RETRY_COUNT, RETRY_WAIT_TIME } from "src/constants/maxretrycount";
import sleep from "../utils/Sleep";
import CacheExtractor from "./providers/CacheExtractor";
import FileBasedExtractor from "./providers/FileBasedExtractor";

export default class LinkExtractor {
    private tiktokDataExtractor: IExtractor = new TiktokRehydrationExtractor();
    private cacheExtractor: IExtractor = new CacheExtractor();

    private p0extractors: IExtractor[] = [
        new TiktokDirectExtractor(),
    ];

    private p1extractors: IExtractor[] = [
        new TiktokGenericExtractor(),
        new GenericExtractor()
    ];

    private async ExtractorTask(extractor: IExtractor, url: string) {
        logger.info(`[bot] Trying ${extractor.constructor.name} - ${extractor.getId()}`);

        try {
            extractor.provideDataExtractor?.(this.tiktokDataExtractor);
            if(!(await performance(extractor, extractor.extractUrl, url))) {
                return null;
            }
        } catch (err: any) {
            logger.warn(`[bot] ${extractor.constructor.name} failed with ${err.toString().replace(/\s+/g, ' ').trim()}`);
            return null;
        }

        return extractor;
    }

    private async TestExtractors(extractors: IExtractor[], url: string): Promise<IExtractor | null> {
        const abortController = new AbortController();
        let validExtractor: IExtractor | null = null;

        await async.each(extractors, async (extractor) => {
            const testedExtractor = await this.ExtractorTask(extractor, url);

            if (abortController.signal.aborted) {
                extractor.dispose?.(false);
                return null;
            }

            if (testedExtractor) {
                validExtractor = testedExtractor;
            }

            if (validExtractor) {
                abortController.abort();
            }

            return null;
        });

        return validExtractor;
    }

    public async extractUrl(url: string, retryCount = 0): Promise<IExtractor> {
        try {
            if (await this.cacheExtractor.extractUrl(url)) {
                logger.info(`[bot] Using ${this.cacheExtractor.constructor.name}`);
                return this.cacheExtractor;
            }

            if (await performance(this.tiktokDataExtractor, this.tiktokDataExtractor.extractUrl, url)) {
                return this.tiktokDataExtractor;
            }

            let workingExtractor = await this.TestExtractors(this.p0extractors, url);

            if (!workingExtractor) {
                const updateInfo = await YoutubeDL("", {
                    update: true,
                    updateTo: "nightly"
                });

                logger.info(`[yt-dlp] ${updateInfo}`);

                workingExtractor = await this.TestExtractors(this.p1extractors, url);
            }

            if (!workingExtractor && retryCount < MAX_RETRY_COUNT) {
                return await this.retry(url, retryCount);
            }

            if (!workingExtractor) {
                throw new Error("No data for provided url found!");
            }

            logger.info(`[bot] Using ${workingExtractor.constructor.name}`);

            if (!(workingExtractor instanceof FileBasedExtractor)) {
                this.cacheExtractor.provideDataExtractor?.(workingExtractor);
            }
            
            return workingExtractor;
        } catch (e) {
            logger.warn(e);
            throw new Error("No data for provided url found!");
        }
    }

    private async retry(url: string, retryCount = 0) {
        logger.info(`[bot] No data for provided url found! | Retrying... [${retryCount + 1} / ${MAX_RETRY_COUNT}]`);
        await sleep(RETRY_WAIT_TIME);
        return await this.extractUrl(url, retryCount + 1);
    }
}