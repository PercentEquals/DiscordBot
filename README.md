# DiscordBot

Simple discord bot that sends tiktok videos, slideshows and comments.  
Also supports audio streaming from tiktok, youtube and discordapp videos.  
Provides commands with multiple options as well as automatic link detection.

### Environment:

- Node.js v18.15.0
- npm v9.5.0

### Setup:

1. Run `git clone https://github.com/PercentEquals/DiscordBot`
2. Run `npm install` in cloned directory
3. Run `npm i -D tsx`
4. Create a .env file in the root directory
5. Add your bot token and app id to the .env file
6. Run `npm run start` to start the bot

### Config options

You can change the config options in `config/config.json` to your liking.  
List of available options with explainations can be found [here](https://github.com/PercentEquals/DiscordBot/blob/main/config/README.md).

### .env file setup:

```
TOKEN=xxx
APPID=xxx
```

### Run on premises using only:

```
npm run start
```