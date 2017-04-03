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
      const sortieToNotify = newData.sortie && !ids.includes(newData.sortie.id)
        && !newData.sortie.isExpired() ? newData.sortie : undefined;
      notifiedIds = notifiedIds
                    .concat(newData.alerts.map(a => a.id))
                    .concat(newData.fissures.map(f => f.id))
                    .concat(newData.invasions.map(i => i.id))
                    .concat(newData.sortie ? [newData.sortie.id] : []);

      this.updateNotified(notifiedIds, platform);

      this.sendAlerts(alertsToNotify, platform);
      this.sendFissures(fissuresToNotify, platform);
      this.sendInvasions(invasionsToNotify, platform);
      if (sortieToNotify) {
        this.sendSortie(sortieToNotify, platform);
      }
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
    .then(channels => Promise.map(channels, (channelRes) => {
      this.bot.messageManager.embedToChannel(channelRes.channelId, embed, `@${type}`);
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
      this.broadcast(embed, platform, 'alerts', a.getRewardTypes())
        // .then(() => this.logger.debug(`broadcast to ${platform} of ${JSON.stringify(embed)}`))
        .catch(this.logger.error);
    });
  }

  sendFissures(newFissures, platform) {
    Promise.map(newFissures, (a) => {
      const embed = new FissureEmbed(this.bot, [a]);
      this.broadcast(embed, platform, 'fissures', null)
        // .then(() => this.logger.debug(`broadcast to ${platform} of ${JSON.stringify(embed)}`))
        .catch(this.logger.error);
    });
  }

  sendInvasions(newInvasions, platform) {
    Promise.map(newInvasions, (i) => {
      const embed = new InvasionEmbed(this.bot, [i]);
      this.broadcast(embed, platform, 'invasions')
        // .then(() => this.logger.debug(`broadcast to ${platform} of ${JSON.stringify(embed)}`))
        .catch(this.logger.error);
    });
  }

  sendSortie(newSortie, platform) {
    const embed = new SortieEmbed(this.bot, newSortie);
    this.broadcast(embed, platform, 'sorties', null)
      // .then(() => this.logger.debug(`broadcast to ${platform} of ${JSON.stringify(embed)}`))
      .catch(this.logger.error);
  }
}

module.exports = Notifier;
