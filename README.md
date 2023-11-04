# DiscordBot

Simple bot that sends tiktok videos, slideshows and comments as attachments.  
Can also play audio from tiktok videos and supports youtube videos and discordapp links.  

### Environment:

- Node.js v18.15.0
- npm v9.5.0
- node-ts v10.9.1

### Setup:

1. Run `git clone https://github.com/PercentEquals/DiscordBot`
2. Run `npm install` in cloned directory
3. Create a .env file in the root directory
4. Add your bot token and app id to the .env file
5. Run `npm run start` to start the bot

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

### Get "api" data from tiktok for development testing using:

```
copy(document.getElementById("SIGI_STATE"))
```