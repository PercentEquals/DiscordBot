import { Command } from "./command";
import { Leave } from "./commands/leave";
import { Play } from "./commands/play";
import { Seek } from "./commands/seek";
import { Stop } from "./commands/stop";
import { Tiktok } from "./commands/tiktok";
import { Volume } from "./commands/volume";

export const Commands: Command[] = [
    Tiktok,
    Play,
    Stop,
    Seek,
    Leave,
    Volume
];