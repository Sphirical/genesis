'use strict';

const Command = require('../Command.js');

class RespondToSettings extends Command {
  constructor(bot) {
    super(bot, 'settings.respondSettings', 'Set whether or not to respond to settings');
    this.usages = [
      { description: 'Change if this channel has settings changes resonded in it', parameters: ['response enabled'] },
    ];
    this.regex = new RegExp('^respond\\s?settings\\s?(.+)?$', 'i');
  }

  run(message) {
    const enable = message.cleanContent.match(this.regex)[1];
    if (!enable) {
      message.channel.sendEmbed({
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <yes|no>`,
            value: '_ _',
          },
        ],
      });
    } else {
      let enableResponse = 0;
      if (enable === 'enable' || enable === 'enable' || enable === '1' || enable === 'true') {
        enableResponse = 1;
      }
      this.bot.settings.setChannelResponseToSettings(message.channel, enableResponse).then(() => {
        message.react('\u2705');
        this.bot.settings.getChannelResponseToSettings(message.channel)
          .then((respondToSettings) => {
            let retPromise = null;
            if (respondToSettings) {
              retPromise = message.reply('Settings updated');
            }
            return retPromise;
          });
      }).catch(this.logger.error);
    }
    if (message.deletable) {
      message.delete(5000).catch(this.logger.error);
    }
  }
}

module.exports = RespondToSettings;
