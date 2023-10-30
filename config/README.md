# Config options

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
Default: `true`

Allows compression of files larger than 25MB. Compression results may vary and might take a while to process.