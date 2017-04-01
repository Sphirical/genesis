'use strict';

const Promise = require('bluebird');
const AlertEmbed = require('../embeds/AlertEmbed.js');
const FissureEmbed = require('../embeds/FissureEmbed.js');
const InvasionEmbed = require('../embeds/InvasionEmbed.js');
const SortieEmbed = require('../embeds/SortieEmbed.js');

/**
 * Notifier for alerts, invasions, etc.
 */
class Notifier {
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;
    this.ids = {};
    this.messageManager = bot.MessageManager;
    this.settings = bot.settings;
  }

  /**
   * Start the notifier
   */
  start() {
    Object.keys(this.bot.worldStates).forEach((k) => {
      this.bot.worldStates[k].on('newData', (platform, newData, oldData) =>
        this.onNewData(platform, newData, oldData));
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  onNewData(platform, newData) {
    let notifiedIds = [];
    this.getNotifiedIds(platform).then((ids) => {
      const alertsToNotify = newData.alerts
        .filter(a => !ids.includes(a.id) && a.getRewardTypes().length && !a.getExpired());
      const invasionsToNotify = newData.invasions
        .filter(i => !ids.includes(i.id) && i.getRewardTypes().length);
      const fissuresToNotify = newData.fissures
        .filter(f => !ids.includes(f.id) && !f.getExpired());
      notifiedIds = notifiedIds
                    .concat(newData.alerts.map(a => a.id))
                    .concat(newData.invasions.map(i => i.id))
                    .concat(newData.sortie ? [newData.sortie.id] : [])
                    .concat(newData.fissures.map(f => f.id));

      this.updateNotified(notifiedIds, platform);

      this.sendAlerts(alertsToNotify, platform);
      this.sendInvasions(invasionsToNotify, platform);
      this.sendSortie(!(ids.includes(newData.sortie.id)
        || newData.sortie.isExpired()) ? newData.sortie : null, platform);
      this.sendFissures(fissuresToNotify, platform);
    }).catch(this.logger.error);
  }

  /**
  * Braodcast embed to all channels for a platform and type
   * @param  {Object} embed      Embed to send to a channel
   * @param  {string} platform   Platform of worldstate
   * @param  {string} type       Type of new data to notify
   * @param  {Array}  [items=[]] Items to broadcast
   * @returns {Promise}
   */
  broadcast(embed, platform, type, items = []) {
    return this.bot.settings.getNotifications(type, platform, items)
    .then(channels => Promise.map(channels,
      (listOfChannels) => {
        listOfChannels.forEach((channel) => {
          this.bot.messageManager.embedToChannel(channel.id, embed, `@${type}`);
        });
      }));
  }

  /**
   * Get the list of notified ids
   * @param  {string} platform Platform to get notified ids for
   * @returns {Promise.<Array>}
   */
  getNotifiedIds(platform) {
    return this.settings.getNotifiedIds(platform, this.bot.shardId);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {JSON} ids list of oids that have been notifiedIds
   * @param {string} platform    platform corresponding to notified ids
   * @returns {Promise}
   */
  updateNotified(ids, platform) {
    return this.settings.setNotifiedIds(platform, this.bot.shardId, ids)
      .catch(this.logger.error);
  }

  sendAlerts(newAlerts, platform) {
    Promise.map(newAlerts, (a) => {
      const embed = new AlertEmbed(this.bot, [a]);
      embed.color = 0x00ff00;
      return this.broadcast(embed, platform, 'alerts', a.getRewardTypes());
    });
  }

  sendFissures(newFissures, platform) {
    Promise.map(newFissures, (f) => {
      const embed = new FissureEmbed(this.bot, [f]);
      embed.color = 0x00ff00;
      return this.broadcast(embed, platform, 'fissures', []);
    });
  }

  sendInvasions(newInvasions, platform) {
    Promise.map(newInvasions, (i) => {
      const embed = new InvasionEmbed(this.bot, [i]);
      embed.color = 0x00ff00;
      return this.broadcast(embed, platform, 'invasions', i.getRewardTypes());
    });
  }

  sendSortie(newSortie, platform) {
    const embed = new SortieEmbed(this.bot, newSortie);
    embed.color = 0x00ff00;
    return this.broadcast(embed, platform, 'sortie', []);
  }
}

module.exports = Notifier;
