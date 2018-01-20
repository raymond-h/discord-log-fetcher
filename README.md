# discord-log-fetcher
Discord bot that fetches logs for channels and gives you a ZIP of 'em

## Installing
```sh
git clone https://github.com/raymond-h/discord-log-fetcher

cd discord-log-fetcher

npm install
```

## Setup
Environment variable `DISCORD_TOKEN` must be set to the Discord token of a bot user. You can set that up at https://discordapp.com/developers/applications/me.

Optionally set environment variable `DISCORD_OWNER_ID` to a Discord user ID, to set that user as the **bot owner**.

```sh
npm start
```


## Usage in Discord

For help: `@Bot help`

To get logs: `@Bot logs <channel name> [<channel name>...]`

Only administrators of the server (and the **bot owner**) can use the bot.
