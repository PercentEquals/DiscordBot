import { ItemModuleChildren, TiktokApi } from "types/tiktokApi";
import { fetchWithRetries } from "./fetchWithReplies";
import { validateUrl } from "./validateUrl";

import cheerio from "cheerio";
import { debugJson } from "../debug";
import { MAX_RETRIES, RETRY_TIMEOUT } from "../constants/maxretries";

export async function getSigiState(url: string, runRetries = 0): Promise<TiktokApi> {
    const urlObj = new URL(url);

    validateUrl(urlObj);

    const response = await fetchWithRetries(url);
    const body = await response.text();

    const $ = cheerio.load(body);
    const $script = $('#SIGI_STATE');
    const sigi_state: TiktokApi = JSON.parse($script.html() as string);

    debugJson('sigi_state', sigi_state);

    // Sometimes tiktok doesn't return the sigi_state, so we retry...
    if (urlObj.hostname.includes('tiktok') && !sigi_state) {
        console.log(`[discord] No sigi_state found. Retrying... (${runRetries} / ${MAX_RETRIES})`);

        if (runRetries >= MAX_RETRIES) {
            throw new Error('No sigi_state found. Please try again later.');
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve(getSigiState(url, runRetries++));
                } catch (e) {
                    reject(e);
                }
            }, RETRY_TIMEOUT);
        });
    }

    return sigi_state;
}

export function getTiktokIdFromTiktokApi(sigi_state: TiktokApi) {
    return Object.keys(sigi_state.ItemModule)[0] as keyof TiktokApi['ItemModule'];
}

export function getImageDataFromTiktokApi(sigi_state: TiktokApi) {
    if (!sigi_state?.ItemModule) return null;

    const id = getTiktokIdFromTiktokApi(sigi_state);
    return (sigi_state.ItemModule?.[id] as ItemModuleChildren)?.imagePost?.images;
}

export function getTitleFromTiktokApi(sigi_state: TiktokApi) {
    if (!sigi_state?.SEOState) return null;

    return sigi_state.SharingMetaState.value["og:description"];
}