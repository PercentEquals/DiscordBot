export namespace TikTokSigner {
    interface signature {
        signature: string;
        verify_fp: string;
        signed_url: string;
        'x-tt-params': string;
        'x-bogus': string;
    }

    interface navigator {
        deviceScaleFactor: number;
        user_agent: string;
        browser_language: string;
        browser_platform: string;
        browser_name: string;
        browser_version: string;
    }
}