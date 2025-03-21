import youtubeDl, { Flags, Payload } from "youtube-dl-exec";

import getConfig, { isValidPath } from "../../setup/configSetup";
import { COOKIES_FROM_BROWSER } from "src/constants/cookiesfrombrowser";

export type ApiData = Payload;

export type YoutubeFlags = {
    updateTo?: string;
    cookiesFromBrowser?: string;
    useExtractors?: string;
} & Flags;

export default async function YoutubeDL(url: string, flags: YoutubeFlags = {}) {
    const cookiesPath = getConfig().environmentOptions.cookiesPath;

    if (cookiesPath && cookiesPath.length > 0 && isValidPath(cookiesPath)) {
        flags = { ...flags, cookies: cookiesPath }
    }

    if (cookiesPath && cookiesPath.length > 0 && COOKIES_FROM_BROWSER.includes(cookiesPath)) {
        flags = {...flags, cookiesFromBrowser: cookiesPath }
    }

    return await youtubeDl(url, flags);
}