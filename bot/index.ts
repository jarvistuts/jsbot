import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from '../config';
import { checkMembership } from '../middleware/checkMembership';
import { checkBotPermissions } from '../lib/checkBotPermissions';

const bot = new Telegraf(BOT_TOKEN);

bot.use(checkMembership);

bot.start((ctx) => ctx.reply('Hello Unique'));
bot.help((ctx) => ctx.reply('send sticker unique'));
bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('who are you'));

bot.launch();
console.log('Bot is running...');
checkBotPermissions(bot.telegram);
