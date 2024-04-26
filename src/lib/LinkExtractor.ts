import logger from "../logger";

import youtubedl from "youtube-dl-exec";

import IExtractor from "./extractors/IExtractor";
import TiktokApiExtractor from "./extractors/TiktokApiExtractor";
import GenericExtractor from "./extractors/GenericExtractor";
import TiktokThirdPartyExtractor from "./extractors/TiktokThirdPartyExtractor";
import TiktokGenericExtractor from "./extractors/TiktokGenericExtractor";
import TiktokRehydrationExtractor from "./extractors/TiktokRehydrationExtractor";

import TikProvider from "./extractors/thirdPartyProviders/TikProvider";

export default class LinkExtractor {
    private extractors: IExtractor[] = [
        new TiktokRehydrationExtractor(),
        new TiktokGenericExtractor(),
        new TiktokApiExtractor(),
        new TiktokThirdPartyExtractor(TikProvider),
        new GenericExtractor()
    ];

    private tiktokDataExtractor: IExtractor | null = null;

    public async extractUrl(url: string): Promise<IExtractor> {
        await youtubedl("", {
            update: true
        });

        for (var extractor of this.extractors) {
            try {
                logger.info(`[bot] Trying ${extractor.constructor.name}`);
                if (await extractor.extractUrl(url)) {
                    logger.info(`[bot] Using ${extractor.constructor.name}`);
                    extractor.provideDataExtractor?.(this.tiktokDataExtractor);
                    return extractor;
                }

                if (extractor.constructor.name === "TiktokRehydrationExtractor") {
                    this.tiktokDataExtractor = extractor;
                }
            } catch (e) {
                logger.debug(e);
            }
        }

        throw new Error("No data found for provided url!");
    }
}