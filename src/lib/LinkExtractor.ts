import logger from "../logger";

import async from "async";

import YoutubeDL from "./YoutubeDLProcessor";

import IExtractor from "./extractors/IExtractor";
import TiktokThirdPartyExtractor from "./extractors/TiktokThirdPartyExtractor";
import TiktokGenericExtractor from "./extractors/TiktokGenericExtractor";
import TiktokRehydrationExtractor from "./extractors/TiktokRehydrationExtractor";
import GenericExtractor from "./extractors/GenericExtractor";
import TiktokDirectExtractor from "./extractors/TiktokDirectExtractor";

import TikProvider from "./extractors/thirdPartyProviders/TikProvider";

import performance from "./utils/Performance";
import { MAX_RETRY_COUNT, RETRY_WAIT_TIME } from "src/constants/maxretrycount";
import sleep from "./utils/Sleep";

export default class LinkExtractor {
    private tiktokDataExtractor: IExtractor = new TiktokRehydrationExtractor();

    private p0extractors: IExtractor[] = [
        new TiktokDirectExtractor(),
        new TiktokThirdPartyExtractor(TikProvider),
    ];

    private p1extractors: IExtractor[] = [
        new TiktokGenericExtractor(),
        new GenericExtractor()
    ];

    private TestExtractors(extractors: IExtractor[], url: string): Promise<IExtractor | null> {
        return new Promise(async (resolve) => {
            let abortToken = false;

            await async.each(extractors, async (extractor) => {
                try {
                    logger.info(`[bot] Trying ${extractor.constructor.name} - ${extractor.getId()}`);

                    extractor.provideDataExtractor?.(this.tiktokDataExtractor);
    
                    if (await performance(extractor, extractor.extractUrl, url)) {
                        if (abortToken) {
                            return extractor.dispose?.(false);
                        }

                        abortToken = true;
                        resolve(extractor);
                    }
                } catch (e: any) {
                    logger.warn(`[bot] ${extractor.constructor.name} failed with ${e.toString().replace(/\s+/g, ' ').trim()}`);
                }
            })

            resolve(null);
        })
    }

    public async extractUrl(url: string, retryCount = 0): Promise<IExtractor> {
        const updateInfo = await YoutubeDL("", {
            update: true,
            //@ts-ignore - it should work...
            updateTo: "nightly"
        });

        logger.info(`[yt-dlp] ${updateInfo}`);

        if (await performance(this.tiktokDataExtractor, this.tiktokDataExtractor.extractUrl, url)) {
            return this.tiktokDataExtractor;
        }

        let workingExtractor = await this.TestExtractors(this.p0extractors, url);

        if (!workingExtractor) {
            workingExtractor = await this.TestExtractors(this.p1extractors, url);
        }

        if (!workingExtractor && retryCount < MAX_RETRY_COUNT) {
            logger.info(`[bot] No data for provided url found! | Retrying... [${retryCount + 1} / ${MAX_RETRY_COUNT}]`);
            await sleep(RETRY_WAIT_TIME);
            return await this.extractUrl(url, retryCount + 1);
        }

        if (!workingExtractor) {
            throw new Error("No data for provided url found!");
        }

        logger.info(`[bot] Using ${workingExtractor.constructor.name}`);
        
        return workingExtractor;
    }
}