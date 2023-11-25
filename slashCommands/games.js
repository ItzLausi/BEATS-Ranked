const fs = require('fs');
const { errorEmbed } = require('../helper/embeds');
const { MessageEmbed } = require('discord.js');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const { nameToUUID, UUIDtoName } = require('../helper/functions');

module.exports = {
    name: 'games',
    description: 'Shows the past games of a player',
    options: [
        {
            name: 'username',
            description: 'Username of the player',
            type: STRING,
            required: false,
        },
    ],
    async execute(discordClient, interaction) {
        const guildLinks = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
        let user = guildLinks[interaction.user.id];

        if (interaction.options.getString('username')) {
            const username = interaction.options.getString('username');
            const uuid = await nameToUUID(username);
            if (!uuid) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(null, 'That player does not exist'),
                    ],
                });
            }
            user = uuid;
        }

        const displayname = await UUIDtoName(user);

        const games = JSON.parse(fs.readFileSync('./data/games.json'));

        let gamesPlayed = 0;
        let replayCodes = [];
        for (const game of games) {
            if (game.players.includes(uuid)) {
                if (game.void) {
                    continue;
                }
                gamesPlayed++;
                replayCodes.push(game.replayCode);
            }
        }

        let text = '';
        if (gamesPlayed === 1) {
            text = 'game';
        } else {
            text = 'games';
        }

        const gamesEmbed = new MessageEmbed()
            .setTitle('Games')
            .setDescription(`**${displayname}** has played **${gamesPlayed}** ${text}`)
            .setColor('#065efc')

        if (replayCodes.length > 0) {
            gamesEmbed.addFields({ name: 'Replay Codes', value: replayCodes.join('\n'), inline: false });
        }

        await interaction.editReply({
            embeds: [
                gamesEmbed,
            ],
        });
    }
};