import fs from "fs";

import { validateUrl } from "src/common/validateUrl";
import { downloadFile } from "src/common/fileUtils";

import FileBasedExtractor from "./FileBasedExtractor";

export default class TiktokDirectExtractor extends FileBasedExtractor {
    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            this.id = validateUrl(url);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            const data = this.dataExtractor?.getData?.();
            const apiData = data?.apiData;

            if (!apiData) {
                return false;
            }

            const videoInfo = apiData.itemInfo.itemStruct.video;
            const downloadAddr = videoInfo.downloadAddr ?? videoInfo.playAddr;

            if (!downloadAddr) {
                return false;
            }

            await downloadFile(
                downloadAddr,
                `cache/${this.getId()}`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Sec-Fetch-Mode": "navigate",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Cookie": data.cookies
                    },
                    credentials: "include",
                    method: "GET"
                }
            );

            return fs.existsSync(`cache/${this.getId()}`);
        } catch (e) {
            this.dispose();
            throw e;
        }
    }
}