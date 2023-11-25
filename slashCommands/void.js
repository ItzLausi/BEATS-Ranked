const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
    name: 'void',
    description: 'Poll to void a match',
    async execute(discordClient, interaction) {
        const VOID_OPTIONS = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('void')
                    .setLabel('Void')
                    .setStyle('SUCCESS')
                    .setEmoji('👍'),
            );

        if (interaction.channel.parentId !== config.channels.gameCategory) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 
                        'This command can only be used in a game channel!'
                    ),
                ],
            });
        }

        const gameChannelId = interaction.channel.id;

        const games = JSON.parse(fs.readFileSync('./data/games.json'));
        const voids = JSON.parse(fs.readFileSync('./data/voids.json'));

        if (voids[gameChannelId]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 
                        'There is already a poll to void this game!'
                    ),
                ],
            });
        }

        for (const game of games) {
            if (game.channelID === gameChannelId) {
                if (game.void) { // if true
                    return interaction.editReply({
                        embeds: [
                            errorEmbed(null, 
                                'This game has already been voided!'
                            ),
                        ],
                    });
                }

                game.void = false;
                fs.writeFileSync('./data/games.json', JSON.stringify(games, null, 4));

                voids[gameChannelId] = 0; 
                fs.writeFileSync('./data/voids.json', JSON.stringify(voids, null, 4));

                const voidEmbed = new MessageEmbed()
                    .setColor('#065efc')
                    .setTitle('Poll to Void')
                    .setDescription(`React with 👍 to void the game, or 👎 to keep the game.`)

                await interaction.channel.send({ embeds: [voidEmbed], components: [VOID_OPTIONS], content: '@everyone' });
                
                await interaction.editReply({ content: '.' });

                return interaction.deleteReply();
            }
        }

        return interaction.editReply({
            embeds: [
                errorEmbed(null, 
                    'Game could not be found! If you believe this is an error, please contact a staff member.'
                ),
            ],
        });
    }
}