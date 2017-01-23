'use strict';

const Promise = require('bluebird');
const AlertEmbed = require('./embeds/AlertEmbed.js');

class Notifier {
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;
    this.ids = {};
  }

  start() {
    Object.keys(this.bot.worldStates).forEach((k) => {
      this.bot.worldStates[k].on('newData', (platform, newData, oldData) =>
        this.onNewData(platform, newData, oldData));
    });
  }

  onNewData(platform, newData) {
    this.getNotifiedIds(platform).then((ids) => {
      const alertsToNotify = newData.alerts.filter(a => !ids.includes(a.id) &&
        a.getRewardTypes().length);
      this.updateNotified(newData.alerts.map(a => a.id), platform);
      return Promise.map(alertsToNotify, (a) => {
        const embed = new AlertEmbed(this.bot, [a]);
        embed.color = 0x00ff00;
        return this.broadcast(embed, platform, 'alert', a.getRewardTypes());
      });
    }).catch(this.logger.error);
  }

  broadcast(embed, platform, type, items = []) {
    return this.bot.settings.getNotifications(type, platform, items).then((channels) => {
      return Promise.map(channels, c => this.bot.client.channels.get(c.id).sendEmbed(embed));
    });
  }

  getNotifiedIds(platform) {
    return Promise.resolve(this.ids[platform] || []);
  }

  updateNotified(ids, platform) {
    this.ids[platform] = ids;
  }
}

module.exports = Notifier;
