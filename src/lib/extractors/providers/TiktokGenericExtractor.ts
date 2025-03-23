import fs from "fs";

import YoutubeDL from "../../yt-dlp/YoutubeDLProcess";

import { validateUrl } from "src/common/validateUrl";

import FileBasedExtractor from "./FileBasedExtractor";

export default class TiktokGenericExtractor extends FileBasedExtractor {
    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            this.id = validateUrl(url);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            await YoutubeDL(url, {
                output: `cache/${this.getId()}`,
                useExtractors: "TikTok"
            });

            if (!fs.existsSync(`cache/${this.getId()}`)) {
                return false;
            }

            return true;
        } catch (e) {
            this.dispose();
            throw e;
        }
    }
}