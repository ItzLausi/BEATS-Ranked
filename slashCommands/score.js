const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const fs = require('fs');
const { nameToUUID, UUIDtoName } = require('../helper/functions');

module.exports = {
    name: 'score',
    description: 'See a player\'s score',
    options: [
        {
            name: 'username',
            description: 'Username of the player to see the score of',
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

        const score = JSON.parse(fs.readFileSync('./data/score.json'));
        if (!score[user]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `${displayname} has not played any games yet`),
                ],
            });
        }

        const points = score[user];

        const embed = new MessageEmbed()
            .setTitle(`${displayname}'s Score`)
            .setColor('#065efc')
            .setDescription(`Score: ${points} points`);

        await interaction.editReply({
            embeds: [
                embed,
            ],
        });
    }
};