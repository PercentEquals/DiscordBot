import { MAX_RETRIES, RETRY_TIMEOUT } from "../constants/maxretries";

export async function fetchWithRetries(url: string, retry = 0): Promise<Response> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return resolve(response);
            }
            
            if (response.status === 404) {
                return reject(new Error('Not found'));
            }

            throw new Error(`Status code ${response.status}`);
        } catch (e) {
            console.error(e);

            if (retry >= MAX_RETRIES) {
                return reject(e);
            }

            console.log(`retrying... (${retry} / ${MAX_RETRIES})`);

            return setTimeout(() => {
                resolve(fetchWithRetries(url, retry + 1));
            }, RETRY_TIMEOUT);
        }
    });
}