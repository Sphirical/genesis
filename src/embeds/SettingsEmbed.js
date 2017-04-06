'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates settings embeds
 */
class SettingsEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Channel} channel - The channel for which to send settings
   * @param {Settings} settings -  The settngs to to display
   */
  constructor(bot, channel, settings) {
    super();

    this.color = 0x00ff00;
    this.url = 'https://warframe-community-developers.github.io/genesis/index.html';
    if (channel.type === 'text') {
      this.title = `Settings for ${channel.name}`;
    } else {
      this.title = `Settings for DM with ${channel.recipient.username}`;
    }

    this.fields = [{ name: '_ _', value: '' }];
    settings.forEach((setting) => {
      this.fields[0].value += `\n**:** ${setting.value}`;
    });
    this.footer.text = 'Enjoy!';
  }
}

module.exports = SettingsEmbed;
