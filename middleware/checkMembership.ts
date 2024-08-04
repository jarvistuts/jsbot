import { Context, MiddlewareFn } from 'telegraf';
import { FSUB_CHATS } from '../config';
import { checkBotPermissions } from '../lib/checkBotPermissions';

type ChatFromGetChat = {
    title: string;
    // other properties of the chat object
};

export const checkMembership: MiddlewareFn<Context> = async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
        return next();
    }

    try {
        // Check if the bot has the necessary permissions in all chats
        const permissions = await checkBotPermissions(ctx.telegram);
        if (!permissions) {
            await ctx.reply('Bot does not have the necessary permissions in all chats.');
            return;
        }

        const missingChats: { chatName: string; inviteLink: string }[] = [];

        for (const chatId of FSUB_CHATS) {
            try {
                const member = await ctx.telegram.getChatMember(chatId, userId);
                if (member.status === 'left' || member.status === 'kicked') {
                    const chatInfo = await ctx.telegram.getChat(chatId);
                    const chatName = (chatInfo as ChatFromGetChat).title || 'Chat';

                    let inviteLink: string;
                    try {
                        const inviteLinkResponse = await ctx.telegram.createChatInviteLink(chatId);
                        inviteLink = inviteLinkResponse.invite_link;
                    } catch (error) {
                        console.error(`Error creating invite link for chat ${chatId}:`, error);
                        continue;
                    }

                    missingChats.push({
                        chatName,
                        inviteLink,
                    });
                }
            } catch (error) {
                console.error(`Error checking membership for chat ${chatId}:`, error);
            }
        }

        if (missingChats.length > 0) {
            const keyboard = missingChats.map(({ chatName, inviteLink }) => ({
                text: chatName,
                url: inviteLink,
            }));

            const replyMarkup = { inline_keyboard: [keyboard] };

            await ctx.reply(
                'You are not a member of the following chats. Please join using the links below:',
                { reply_markup: replyMarkup }
            );
            return; // Break the middleware chain if the user is not a member of all required chats
        } else {
            await ctx.reply('You are a member of all the required chats.');
        }
    } catch (error) {
        console.error('Error in checkMembership middleware:', error);
        await ctx.reply('An error occurred while checking your membership. Please try again later.');
    }

    return next();
};
