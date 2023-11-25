const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const fs = require('fs');
const { nameToUUID } = require('../helper/functions');

module.exports = {
    name: 'remove',
    description: 'Removes points from a player',
    options: [
        {
            name: 'username',
            description: 'Username of the player',
            type: STRING,
            required: true,
        },
        {
            name: 'points',
            description: 'Amount of points to remove',
            type: STRING,
            required: true,
        },
    ],
    async execute(discordClient, interaction) {
        const score = JSON.parse(fs.readFileSync('./data/score.json'));

        const username = interaction.options.getString('username');
        const points = interaction.options.getString('points');

        const uuid = await nameToUUID(username);
        if (!uuid) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'The player does not exist'),
                ],
            });
        }

        if (!score[uuid]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'The player does not have any points'),
                ],
            });
        }

        if (points > score[uuid]) {
            score[uuid] = 0;
        } else {
            score[uuid] -= points;
        }

        fs.writeFileSync('./data/score.json', JSON.stringify(score));

        await interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setTitle('Points removed')
                    .setDescription(`Removed ${points} points from ${username}`)
                    .setColor('#065efc'),
            ],
        });
    }
};