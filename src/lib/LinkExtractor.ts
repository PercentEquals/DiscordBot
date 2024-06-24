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

export default class LinkExtractor {
    private extractors: IExtractor[] = [
        new TiktokDirectExtractor(),
        new TiktokGenericExtractor(),
        new TiktokThirdPartyExtractor(TikProvider),
        new GenericExtractor()
    ];

    private tiktokDataExtractor: IExtractor = new TiktokRehydrationExtractor();

    private async TestExtractors(url: string): Promise<IExtractor> {
        return new Promise(async (resolve, reject) => {
            let abortToken = false;

            await async.each(this.extractors, async (extractor) => {
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

            reject("No data found for provided url!");
        })
    }

    public async extractUrl(url: string): Promise<IExtractor> {
        const updateInfo = await YoutubeDL("", {
            update: true,
            //@ts-ignore - it should work...
            updateTo: "nightly"
        });

        logger.info(`[yt-dlp] ${updateInfo}`);

        if (await performance(this.tiktokDataExtractor, this.tiktokDataExtractor.extractUrl, url)) {
            return this.tiktokDataExtractor;
        }

        const workingExtractor = await this.TestExtractors(url);

        logger.info(`[bot] Using ${workingExtractor.constructor.name}`);
        
        return workingExtractor;
    }
}