import youtubedl, { Flags, Payload } from "youtube-dl-exec";

import getConfig, { isValidPath } from "../setup/configSetup";
import { COOKIES_FROM_BROWSER } from "src/constants/cookiesfrombrowser";

export type ApiData = Payload;

export default async function YoutubeDL(url: string, flags?: Flags | undefined) {
    const cookiesPath = getConfig().environmentOptions.cookiesPath;

    if (cookiesPath && cookiesPath.length > 0 && isValidPath(cookiesPath)) {
        flags = { ...flags, cookies: cookiesPath }
    }

    if (cookiesPath && cookiesPath.length > 0 && COOKIES_FROM_BROWSER.includes(cookiesPath)) {
        //@ts-ignore - cookiesFromBrowser is correct
        flags = {...flags, cookiesFromBrowser: cookiesPath }
    }

    return await youtubedl(url, flags);
}