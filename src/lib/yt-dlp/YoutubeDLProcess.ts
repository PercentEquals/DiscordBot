import { Flags, Payload } from "youtube-dl-exec";

import getConfig, { isValidPath } from "../../setup/configSetup";
import { COOKIES_FROM_BROWSER } from "src/constants/cookiesfrombrowser";
import { getNodeModulesPath } from "src/common/fileUtils";

export type ApiData = Payload;

export type YoutubeFlags = {
    updateTo?: string;
    cookiesFromBrowser?: string;
    useExtractors?: string;
} & Flags;

class YoutubeDLProcess {
    private static jsonToArgs(json: YoutubeFlags) {
        return Object.entries(json).map(([key, value]) => {
            key = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

            if (typeof value === "boolean") {
                return `--${value ? "" : "no-"}${key}`;
            }

            return `--${key}=${value}`;
        });
    }

    public static async YoutubeDL(url: string, flags: YoutubeFlags) {
        const args = [getNodeModulesPath("youtube-dl-exec/bin/yt-dlp"), url, ...this.jsonToArgs(flags)].filter((arg) => arg !== "")
        const proc = Bun.spawn(args);
        return await new Response(proc.stdout).text();
    }
}

export default async function YoutubeDL(url: string, flags: YoutubeFlags = {}) {
    const cookiesPath = getConfig().environmentOptions.cookiesPath;

    if (cookiesPath && cookiesPath.length > 0 && isValidPath(cookiesPath)) {
        flags = { ...flags, cookies: cookiesPath }
    }

    if (cookiesPath && cookiesPath.length > 0 && COOKIES_FROM_BROWSER.includes(cookiesPath)) {
        flags = {...flags, cookiesFromBrowser: cookiesPath }
    }

    return await YoutubeDLProcess.YoutubeDL(url, flags ?? {});
}