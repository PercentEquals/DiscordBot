import { validateUrl } from "src/common/validateUrl";

export default async function TikProvider(url: string) {
    return `https://tikcdn.io/ssstik/${validateUrl(url)}`;
} 