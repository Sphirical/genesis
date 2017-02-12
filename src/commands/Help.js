'use strict';

const Command = require('../Command.js');


/**
 * Describes the Help command
 */
class Help extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'core.help', 'help', 'Display this message');

    this.helpEmbed = null;

    /**
     * Help reply messsage for alerting a user to check their direct messages.
     * @type {string}
     * @private
     */
    this.helpReplyMsg = process.env.HELP_REPLY || ' check your direct messages for help.';
  }

  /**
   * Send help message
   * @param {Message} message Message to reply to
   */
  run(message) {
    if (message.channel.type !== 'dm') {
      message.reply(this.helpReplyMsg)
        .then((reply) => {
          if (reply.deletable) {
            reply.delete(10000);
          }
        }).catch(this.logger.error);
    }
    this.sendHelpEmbed(message);

    if (message.author.id === this.bot.owner) {
      this.sendOwnerOnlyEmbed(message);
    }
  }

  sendHelpEmbed(message) {
    const helpEmbed = {
      type: 'rich',
      thumbnail: {
        url: 'https://github.com/aliasfalse/genesis/raw/master/src/resources/cephalontransparent.png',
      },
    };

    this.bot.settings.getChannelPrefix(message.channel).then((prefix) => {
      const commands = this.commandHandler.commands.filter(c => !c.ownerOnly)
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
          value: u.description,
          inline: false,
        }
      )));

      helpEmbed.fields = [].concat(...commands);

      return message.author.sendEmbed(helpEmbed).then(() => {
        if (message.deletable) {
          message.delete(2000);
        }
      });
    }).catch(this.logger.error);
  }

  sendOwnerOnlyEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel).then((prefix) => {
      const ownerCommands = this.commandHandler.commands.filter(c => c.ownerOnly)
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(' ')}`,
          value: u.description,
          inline: false,
        })));
      const embed = {
        title: 'Owner only',
        fields: [].concat(...ownerCommands),
        color: 0xff0000,
      };

      return message.author.sendEmbed(embed).then(() => {
        if (message.deletable) {
          message.delete(2000);
        }
      });
    }).catch(this.logger.error);
  }
}

module.exports = Help;
