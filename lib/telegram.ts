export async function sendTelegramMessage(text: string) {
    const botToken = process.env.TG_BOT_TOKEN;
    const channelId = process.env.TG_CHANNEL_ID;

    if (!botToken || !channelId) return;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: channelId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        }),
    });
}