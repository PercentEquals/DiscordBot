# Config options

## Bot options

### automaticLinkDetection

Type: `boolean`<br>
Default: `true`

Automatically detects links in channel messages and sends them as an attachment.  
Requires MESSAGE CONTENT INTENT enabled in the Discord developer portal.  
More info here: https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-FAQ

### automaticLinkDetectionErrorReply

Type: `boolean`<br>
Default: `true`

Should automatic link detection reply with an error message if it fails to send the link as an attachment.

### allowCompressionOfLargeFiles

Type: `boolean`<br>
Default: `false`

Allows compression of files larger than 25MB. Compression results may vary and might take a while to process.

### useVxFallback

Type: `boolean`<br>
Default: `true`

Should the bot use vx* links as fallback.

## Environment options

### ffmpegPath

Type: `string`<br>
Default: ``

Path to the ffmpeg executable. If not set, the bot will use default one, which might be slower and not work on some systems.  
It is recommended to set this option on Cloud systems, where the default ffmpeg might work incorrectly. Linux example:   
```
apt-get install ffmpeg
which ffmpeg
```

And the result of `which ffmpeg` can be set as the `ffmpegPath` option.

### logToFile

Type: `boolean`<br>
Default: `false`

Should the bot log to a file. Generated log file can be found in the `logs` folder.