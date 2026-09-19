# Telegram Alert Bot — Setup Guide

## 1. Get a Bot Token
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the token it gives you (looks like `123456:ABC-DEF...`)
4. Export it as an environment variable (never paste secrets into source):
   ```powershell
   $env:TELEGRAM_BOT_TOKEN="<your-token>"
   $env:TELEGRAM_CHAT_ID="<your-chat-id>"
   ```

## 2. Install Dependencies
```bash
pip install -r requirements.txt
```

## 3. Run the Bot
```bash
python bot.py
```

## 4. Test It
- Open Telegram, search for your bot by the username you gave it
- Send `/start` — bot replies with a welcome message
- Send `/hello` — bot replies with "Hello, World!"

## Next Steps (for real alerts)
To send alerts from your website, you'll use the `send_message` API:

```python
import asyncio
import os
from telegram import Bot

async def send_alert(message: str):
    bot = Bot(token=os.environ["TELEGRAM_BOT_TOKEN"])
    await bot.send_message(chat_id=os.environ["TELEGRAM_CHAT_ID"], text=message)

# Get your chat_id by messaging your bot and visiting:
# https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Your website backend can call `send_alert("🚨 Site is down!")` whenever something happens.
