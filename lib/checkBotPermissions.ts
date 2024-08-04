import { Telegram } from 'telegraf';
import { FSUB_CHATS } from '../config';

export async function checkBotPermissions(telegram: Telegram) {
    try {
        const botInfo = await telegram.getMe();
        const botId = botInfo.id;

        for (const chatId of FSUB_CHATS) {
            try {
                const botMember = await telegram.getChatMember(chatId, botId);
                if (botMember.status === 'kicked') {
                    console.error(`Bot is banned from chat ${chatId}`);
                    continue;
                }
                if (botMember.status !== 'administrator') {
                    console.error(`Bot is not an administrator in chat ${chatId}`);
                    continue;
                }
                if (!botMember.can_invite_users) {
                    console.error(`Bot does not have invite permissions in chat ${chatId}`);
                    continue;
                }

                console.log(`Connected FSUB to ${chatId}`);
            } catch (error) {
                if (isTelegramError(error)) {
                    if (error.response && error.response.error_code === 403) {
                        console.error(`Bot is banned or kicked from chat ${chatId}`);
                    } else if (error.response && error.response.error_code === 400) {
                        console.error(`Chat ${chatId} not found or bot not in chat`);
                    } else {
                        console.error(`Error checking permissions for chat ${chatId}:`, error);
                    }
                } else {
                    console.error(`Unexpected error checking permissions for chat ${chatId}:`, error);
                }
                continue
            }
        }
        return true
    } catch (error) {
        console.error('Unexpected error in checkBotPermissions function:', error);
        return false
    }
}

function isTelegramError(error: unknown): error is { response: { error_code: number, description: string } } {
    return typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response.error_code === 'number';
}
