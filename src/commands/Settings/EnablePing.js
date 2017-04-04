'use strict';

const Command = require('../../Command.js');
const eventTypes = require('../../resources/trackables.json').eventTypes;
const rewardTypes = require('../../resources/trackables.json').rewardTypes;

/**
 * Sets the current guild's custom prefix
 */
class EnablePingEvent extends Command {
  constructor(bot) {
    super(bot, 'settings.ping.enable', 'ping on');
    this.usages = [
      { description: 'Show command for pinging for items', parameters: [] },
      { description: 'Enable pinging for an event(s) or  or item(s)', parameters: ['event(s) or item(s) to enable ping for'] },
    ];
    this.regex = new RegExp(`^${this.call}?(?:\\s+(${eventTypes.join('|')}|${rewardTypes.join('|')}|all)*)?`, 'i');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const unsplitItems = message.strippedContent.replace(`${this.call} `, '');
    if (!unsplitItems) {
      this.sendInstructionEmbed(message);
      return;
    }

    const items = unsplitItems.split(' ');
    let itemsToPing = [];
    let eventsToPing = [];
    let savePing = true;
    if (items[0] === 'all') {
      eventsToPing = eventsToPing.concat(eventTypes);
      itemsToPing = itemsToPing.concat(rewardTypes);
    } else {
      items.forEach((item) => {
        if (rewardTypes.includes(item.trim()) && savePing) {
          itemsToPing.push(item.trim());
        } else if (eventTypes.includes(item.trim()) && savePing) {
          eventsToPing.push(item.trim());
        } else if ((eventsToPing.length === 0 || itemsToPing.length === 0) && savePing) {
          this.sendInstructionEmbed(message);
          savePing = false;
        }
      });
    }

    const promises = [];
    if (savePing) {
      eventsToPing.forEach(event => promises.push(this.bot.settings
        .setEventTypePing(message.channel, event, true)));
      itemsToPing.forEach(item => promises.push(this.bot.settings
        .setItemPing(message.channel, item, true)));
      this.messageManager.notifySettingsChange(message, true, true);
    }
    promises.forEach(promise => promise.catch(this.logger.error));
  }

  sendInstructionEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => this.messageManager.embed(message, {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${prefix}${this.call} <event(s)/item(s) to ping for>`,
            value: 'Enable pinging for an event/item',
          },
          {
            name: 'Possible values:',
            value: '_ _',
          },
          {
            name: '**Events:**',
            value: eventTypes.join('\n'),
            inline: true,
          },
          {
            name: '**Rewards:**',
            value: rewardTypes.join('\n'),
            inline: true,
          },
        ],
      }, true, false))
      .catch(this.logger.error);
  }
}

module.exports = EnablePingEvent;
