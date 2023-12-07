import { ItemModule, ItemModuleChildren, TiktokApi } from "types/tiktokApi";
import { fetchWithRetries } from "./fetchWithReplies";
import { validateUrl } from "./validateUrl";

import { chromium } from "playwright";
import cheerio from "cheerio";

import { MAX_RETRIES, RETRY_TIMEOUT } from "../constants/maxretries";
import logger from "../logger";

export async function alternativeGetSigiState(url: string) {
    logger.info('[bot] no sigi_state found. Trying alternative method...');

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForTimeout(2000);

    const body = await page.content();
    const $ = cheerio.load(body);
    const $script = $('#SIGI_STATE');

    await browser.close();

    const sigi_state: TiktokApi = JSON.parse($script.html() as string);
    return sigi_state;
}

export async function getSigiState(url: string, runRetries = 0): Promise<TiktokApi> {
    const urlObj = new URL(url);
    validateUrl(urlObj);

    const response = await fetchWithRetries(url);
    const body = await response.text();

    const $ = cheerio.load(body);
    const $script = $('#SIGI_STATE');
    const sigi_state: TiktokApi = JSON.parse($script.html() as string);

    // Sometimes tiktok doesn't return the sigi_state, so we retry...
    if (urlObj.hostname.includes('tiktok') && !sigi_state) {
        logger.info(`[bot] no sigi_state found. Retrying... (${runRetries} / ${MAX_RETRIES})`);

        if (runRetries >= MAX_RETRIES) {
            try {
                return await alternativeGetSigiState(url);
            } catch (e) {
                logger.error(e);
                throw new Error('No sigi_state found - bot could be rate limited for now. Please try again later.');
            }
        }

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    resolve(await getSigiState(url, runRetries+1));
                } catch (e) {
                    reject(e);
                }
            }, RETRY_TIMEOUT);
        });
    }

    return sigi_state;
}

export async function getTiktokIdFromTiktokUrl(url: string) {
    const urlObj = new URL(url);
    const fallbackId = validateUrl(urlObj);

    try {
        const response = await fetchWithRetries(url);
        const body = await response.text();

        const $ = cheerio.load(body);
        const $ogUrl = $('meta[property="og:url"]');

        const ogUrl = $ogUrl.attr('content') as string;
        const id = ogUrl.match(/video\/(\d+)/)?.[1] as string;
        return id;
    } catch (e) {
        return fallbackId;
    }
}

export async function getImageDataFromTiktokApi(url: string) {
    const sigi_state = await getSigiState(url);
    if (!sigi_state?.ItemModule) return null;

    const id = await getTiktokIdFromTiktokUrl(url);
    return (sigi_state.ItemModule?.[id as keyof ItemModule] as ItemModuleChildren)?.imagePost?.images;
}