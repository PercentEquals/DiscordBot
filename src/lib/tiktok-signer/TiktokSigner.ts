//@ts-ignore - tiktok-signature types not available (https://github.com/carcabot/tiktok-signature)
import Utils from "tiktok-signature/utils.js";

// Based on: https://github.com/carcabot/tiktok-signature/issues/219
import fs from 'fs';
import { Browser } from 'happy-dom';

import { TIKTOK_COMMENTS_COUNT, TIKTOK_COMMENTS_MAX_COUNT, TIKTOK_COMMENTS_OFFSET } from "src/constants/tiktokcommentscount";
import { extractUrl, validateUrl } from "src/common/validateUrl";
import { TiktokCommentsApi } from "types/tiktokCommentsApi";
import { getNodeModulesPath } from "src/common/fileUtils";

export class TiktokSigner {
    private userAgent: string = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36";
    private MSTOKEN = "G1lr_8nRB3udnK_fFzgBD7sxvc0PK6Osokd1IJMaVPVcoB4mwSW-D6MQjTdoJ2o20PLt_MWNgtsAr095wVSShdmn_XVFS34bURvakVglDyWAHncoV_jVJCRdiJRdbJBi_E_KD_G8vpFF9-aOaJrk";
    private bogus: string = "";
    private sig: string = "";

    private ensureSignature(url: string) {
        if (this.bogus !== "" && this.sig !== "") {
            return;
        }

        const signer_script = fs.readFileSync(getNodeModulesPath("tiktok-signature/javascript/signer.js"), "utf8");
        const x_bogus_script = fs.readFileSync(getNodeModulesPath("tiktok-signature/javascript/xBogus.js"), "utf8");
        const browser = new Browser();
        const page = browser.newPage();

        page.evaluate(signer_script);
        page.evaluate(x_bogus_script);

        this.sig = page.evaluate(`generateSignature("${url}")`);
        this.bogus = page.evaluate(`generateBogus("${url}", "${this.userAgent}")`);

        browser.close();
    }

    private sign(url: string) {
        this.ensureSignature(url);
        return url + "&verifyFp=" + Utils.generateVerifyFp() + "&_signature=" + this.sig + "&X-Bogus=" + this.bogus;
    }

    public async getComments(url: string, range: number[]): Promise<TiktokCommentsApi> {
        const id = validateUrl(await extractUrl(url));

        const queryParams = {
            aweme_id: id,
            cursor: TIKTOK_COMMENTS_OFFSET,
            count: TIKTOK_COMMENTS_COUNT,
            msToken: this.MSTOKEN,
            aid: '1988',
            app_language: 'ja-JP',
            app_name: 'tiktok_web',
            battery_info: 1,
            browser_language: 'en-US',
            browser_name: 'Mozilla',
            browser_online: true,
            browser_platform: 'Win32',
            browser_version: this.userAgent,
            channel: 'tiktok_web',
            cookie_enabled: true,
            current_region: 'JP',
            device_id: '7165118680723998214',
            device_platform: 'web_pc',
            from_page: 'video',
            os: 'windows',
            priority_region: 'US',
            referer: '',
            region: 'US',
            screen_height: 1440,
            screen_width: 2560,
            webcast_language: 'en',
        } as any;

        if (range.length > 1) {
            queryParams.cursor = Math.min(...range);
            queryParams.count = Math.max(...range) - queryParams.cursor;

            if (queryParams.count >= TIKTOK_COMMENTS_MAX_COUNT) {
                queryParams.count = TIKTOK_COMMENTS_MAX_COUNT;
            }
        }

        const commentsApi = new URL('https://www.tiktok.com/api/comment/list/?' + (new URLSearchParams(queryParams)).toString());
        const response =  await fetch(
            this.sign(commentsApi.toString()),
            {
                headers: {
                    'user-agent': this.userAgent,
                    'referer': url,
                }
            }
        )

        return await response.json() as TiktokCommentsApi;
    }
}