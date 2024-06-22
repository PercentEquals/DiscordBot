import logger from "../logger";

import async from "async";

import YoutubeDL from "./YoutubeDLProcessor";

import IExtractor from "./extractors/IExtractor";
import TiktokApiExtractor from "./extractors/TiktokApiExtractor";
import TiktokThirdPartyExtractor from "./extractors/TiktokThirdPartyExtractor";
import TiktokGenericExtractor from "./extractors/TiktokGenericExtractor";
import TiktokRehydrationExtractor from "./extractors/TiktokRehydrationExtractor";
import GenericExtractor from "./extractors/GenericExtractor";

import TikProvider from "./extractors/thirdPartyProviders/TikProvider";
import performance from "./utils/Performance";

export default class LinkExtractor {
    private extractors: IExtractor[] = [
        new TiktokApiExtractor(),
        new TiktokGenericExtractor(),
        new TiktokGenericExtractor("0"),
        new TiktokThirdPartyExtractor(TikProvider),
        new GenericExtractor()
    ];

    private tiktokDataExtractor: IExtractor = new TiktokRehydrationExtractor();

    private async TestExtractors(url: string): Promise<IExtractor> {
        return new Promise(async (resolve, reject) => {
            let abortToken = false;

            await async.each(this.extractors, async (extractor) => {
                try {
                    if (abortToken) {
                        return;
                    }

                    logger.info(`[bot] Trying ${extractor.constructor.name}`);
    
                    if (await performance(extractor, extractor.extractUrl, url)) {
                        abortToken = true;
                        resolve(extractor);
                    }
                } catch (e: any) {
                    logger.warn(`[bot] ${extractor.constructor.name} failed with ${e.toString().replace(/\s+/g, ' ').trim()}`);
                }
            })

            reject("No data found for provided url!");
        })
    }

    public async extractUrl(url: string): Promise<IExtractor> {
        await YoutubeDL("", {
            update: true
        });

        if (await performance(this.tiktokDataExtractor, this.tiktokDataExtractor.extractUrl, url)) {
            return this.tiktokDataExtractor;
        }

        const workingExtractor = await this.TestExtractors(url);

        logger.info(`[bot] Using ${workingExtractor.constructor.name}`);
        workingExtractor.provideDataExtractor?.(this.tiktokDataExtractor);
        
        return workingExtractor;
    }
}