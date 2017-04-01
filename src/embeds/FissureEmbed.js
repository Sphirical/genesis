'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates fissure embeds
 */
class FissureEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Fissure>} fissures - The fissures to be included in the embed
   */
  constructor(bot, fissures) {
    super();

    if (fissures.length < 2) {
      this.title = 'Worldstate - Void Fissures';
      this.description = 'Current Void Fissures';
    }

    if (fissures.length > 1) {
      fissures.sort((a, b) => a.tierNum - b.tierNum);

      this.fields = fissures.map(f => ({
        name: `${f.missionType} ${f.tier}`,
        value: `[${f.getETAString()}] ${f.node} against ${f.enemy}`,
      }));
    } else if (fissures.length === 0) {
      this.fields = {
        name: 'Currently no fissures',
        value: '',
      };
    } else {
      const f = fissures[0];
      this.title = `${f.missionType} ${f.tier}`;
      this.description = `${f.node} against ${f.enemy}`;
      this.fields = [{ name: '_ _', value: `${f.getETAString()} remaining | ${new Date().toLocaleString()}` }];
    }

    this.color = 0x4aa1b2;
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/voidFissure.png',
    };
  }
}

module.exports = FissureEmbed;
