import { Command } from "./command";
import { Play } from "./commands/play";
import { Stop } from "./commands/stop";
import { Tiktok } from "./commands/tiktok";

export const Commands: Command[] = [
    Tiktok,
    Play,
    Stop
];