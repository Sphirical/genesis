'use strict';

const Command = require('../../Command.js');
const SettingsEmbed = require('../../embeds/SettingsEmbed.js');

class Settings extends Command {
  constructor(bot) {
    super(bot, 'settings.settings', 'settings', 'Get settings');
    this.regex = new RegExp(`^${this.call}$`, 'i');
  }

  run(message) {
    const settings = [];
    this.bot.settings.getChannelLanguage(message.channel)
      .then((language) => {
        settings.push({ name: 'Language', value: language, inline: true });
        return this.bot.settings.getChannelPlatform(message.channel);
      })
      .then((platform) => {
        settings.push({ name: 'Platform', value: platform, inline: true });
        return this.bot.settings.getChannelResponseToSettings(message.channel);
      })
      .then((respond) => {
        settings.push({ name: 'Respond to Settings', value: respond === '1' ? 'yes' : 'no', inline: true });
        return this.bot.settings.getChannelDeleteAfterResponse(message.channel);
      })
      .then((deleteAfterRespond) => {
        settings.push({ name: 'Delete Message After Responding', value: deleteAfterRespond === '1' ? 'yes' : 'no', inline: true });
        return this.bot.settings.getChannelPrefix(message.channel);
      })
      .then((prefix) => {
        settings.push({ name: 'Command Prefix', value: prefix, inline: true });
        return this.bot.settings.getTrackedItems(message.channel);
      })
      .then((items) => {
        settings.push({
          name: 'Tracked Items',
          value: items.length > 0 ? `\n${items.join(' ')}` : 'No Tracked Items',
          inline: true,
        });
        return this.bot.settings.getTrackedEventTypes(message.channel);
      })
      .then((types) => {
        settings.push({
          name: 'Tracked Events',
          value: types.length > 0 ? `\n${types.join(' ')}` : 'No Tracked Event Types',
          inline: true,
        });
        return this.bot.settings.getPingsForGuild(message.guild);
      })
      .then((pingsArray) => {
        settings.push({
          name: 'Pings per Item',
          value: pingsArray.length > 0 ? `\n${pingsArray.filter(obj => obj.thing && obj.text).map(obj => `**${obj.thing}**: ${obj.text}`).join('\n')}` : 'No Configured Pings',
          inline: false,
        });
        const embed = new SettingsEmbed(this.bot, message.channel, settings);
        this.messageManager.embed(message, embed, false, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = Settings;
