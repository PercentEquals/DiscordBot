import logger from "../logger";

import IExtractor from "./extractors/IExtractor";
import TiktokExtractor from "./extractors/TiktokApiExtractor";
import GenericExtractor from "./extractors/GenericExtractor";
import TiktokThirdPartyExtractor from "./extractors/TiktokThirdPartyExtractor";
import TiktokGenericExtractor from "./extractors/TiktokGenericExtractor";

export default class LinkExtractor {
    private extractors: IExtractor[] = [
        new TiktokExtractor(),
        new TiktokGenericExtractor(),
        new TiktokThirdPartyExtractor(),
        new GenericExtractor()
    ];

    public async extractUrl(url: string): Promise<IExtractor> {
        for (var extractor of this.extractors) {
            try {
                if (await extractor.extractUrl(url)) {
                    return extractor;
                }
            } catch (e) {
                logger.warn(e);
            }
        }

        throw new Error("No data found for provided url!");
    }
}