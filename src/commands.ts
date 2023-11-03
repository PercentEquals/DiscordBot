import { Command } from "./command";
import { Play } from "./commands/play";
import { Tiktok } from "./commands/tiktok";

export const Commands: Command[] = [
    Tiktok,
    Play
];