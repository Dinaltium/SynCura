import logging
import os
from telegram import Update, Bot
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# --- CONFIG (from environment; never commit real tokens) ---
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# --- LOGGING ---
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)

# --- ALERT FUNCTION (call this from your website) ---
async def send_alert(message: str):
    bot = Bot(token=BOT_TOKEN)
    await bot.send_message(chat_id=CHAT_ID, text=message)

# --- HANDLERS ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Responds to /start command."""
    await update.message.reply_text("👋 Hello! I'm your website alert bot. Use /hello to test me.")

async def hello(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Responds to /hello command — your first alert test."""
    await update.message.reply_text("🌍 Hello from SynCura alerts!")

async def test_alert(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a test alert via /testalert command."""
    await send_alert("🔔 Test alert from your website bot!")
    await update.message.reply_text("✅ Alert sent to your chat!")

# --- MAIN ---
if __name__ == "__main__":
    if not BOT_TOKEN:
        raise SystemExit("TELEGRAM_BOT_TOKEN is not set; refusing to start.")
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("hello", hello))
    app.add_handler(CommandHandler("testalert", test_alert))

    print("Bot is running... Press Ctrl+C to stop.")
    app.run_polling()
