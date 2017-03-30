'use strict';

const Promise = require('bluebird');
const AlertEmbed = require('../embeds/AlertEmbed.js');
const InvasionEmbed = require('../embeds/InvasionEmbed.js');

class Notifier {
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;
    this.ids = {};
    this.messageManager = bot.MessageManager;
  }

  start() {
    Object.keys(this.bot.worldStates).forEach((k) => {
      this.bot.worldStates[k].on('newData', (platform, newData, oldData) =>
        this.onNewData(platform, newData, oldData));
    });
  }

  onNewData(platform, newData) {
    this.getNotifiedIds(platform).then((ids) => {
      const alertsToNotify = newData.alerts
        .filter(a => !ids.includes(a.id) && a.getRewardTypes().length);
      const invasionsToNotify = newData.invasions
        .filter(i => !ids.includes(i.id) && i.getRewardTypes().length);
      this.updateNotified(newData.alerts.map(a => a.id), platform);
      this.updateNotified(newData.invasions.map(i => i.id), platform);
      this.sendAlerts(alertsToNotify, platform);
      this.sendInvasions(invasionsToNotify, platform);
    }).catch(this.logger.error);
  }

  broadcast(embed, platform, type, items = []) {
    return this.bot.settings.getNotifications(type, platform, items)
    .then(channels => Promise.map(channels,
      (listOfChannels) => {
        listOfChannels.forEach((channel) => {
          this.bot.messageManager.embedToChannel(channel.id, embed, '_ _');
        });
      }));
  }

  getNotifiedIds(platform) {
    return Promise.resolve(this.ids[platform] || []);
  }

  updateNotified(ids, platform) {
    this.ids[platform] = this.ids[platform] ? this.ids[platform].concat(ids) : ids;
  }

  sendAlerts(newAlerts, platform) {
    Promise.map(newAlerts, (a) => {
      const embed = new AlertEmbed(this.bot, [a]);
      embed.color = 0x00ff00;
      return this.broadcast(embed, platform, 'alerts', a.getRewardTypes());
    });
  }

  sendInvasions(newInvasions, platform) {
    Promise.map(newInvasions, (i) => {
      const embed = new InvasionEmbed(this.bot, [i]);
      embed.color = 0x00ff00;
      return this.broadcast(embed, platform, 'invasions', i.getRewardTypes());
    });
  }
}

module.exports = Notifier;
