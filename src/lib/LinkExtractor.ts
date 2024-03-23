import logger from "../logger";

import IExtractor from "./extractors/IExtractor";
import TiktokApiExtractor from "./extractors/TiktokApiExtractor";
import GenericExtractor from "./extractors/GenericExtractor";
import TiktokThirdPartyExtractor from "./extractors/TiktokThirdPartyExtractor";
import TiktokGenericExtractor from "./extractors/TiktokGenericExtractor";
import TiktokRehydrationExtractor from "./extractors/TiktokRehydrationExtractor";

export default class LinkExtractor {
    private extractors: IExtractor[] = [
        new TiktokRehydrationExtractor(),
        new TiktokGenericExtractor(),
        new TiktokApiExtractor(),
        new TiktokThirdPartyExtractor(),
        new GenericExtractor()
    ];

    public async extractUrl(url: string): Promise<IExtractor> {
        for (var extractor of this.extractors) {
            try {
                if (await extractor.extractUrl(url)) {
                    logger.info(`[bot] Using ${extractor.constructor.name}`)
                    return extractor;
                }
            } catch (e) {
                logger.debug(e);
            }
        }

        throw new Error("No data found for provided url!");
    }
}