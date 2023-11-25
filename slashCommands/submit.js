const fs = require('fs');
const { errorEmbed } = require('../helper/embeds');
const { MessageEmbed } = require('discord.js');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const config = require('../config.json');

module.exports = {
    name: 'submit',
    description: 'Submit the replay code of the game',
    options: [
        {
            name: 'replay-code',
            description: 'The replay code of the game',
            type: STRING,
            required: true,
        },
    ],
    async execute(discordClient, interaction) {
        const replayCode = interaction.options.getString('replay-code');

        if (interaction.channel.parentID !== config.channels.gameCategory) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 
                        'This command can only be used in a game channel!'
                    ),
                ],
            });
        }

        if (!replayCode.startsWith('/replay ')) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null,
                        'Please use the command like this: `/replay <replay code>`'
                    ),
                ],
            });
        }

        const replayCodeSplit = replayCode.split(' ');
        const replayCodeFinal = replayCodeSplit[1];

        const games = JSON.parse(fs.readFileSync('./data/games.json'));
        
        for (const game of games) {
            if (game.channelID === interaction.channel.id) {
                game.replayCode = replayCodeFinal;

                fs.writeFileSync('./data/games.json', JSON.stringify(games, null, 2));

                const replayEmbed = new MessageEmbed()
                    .setTitle('Replay Code Submitted')
                    .setDescription(`The replay code has been set to \`${replayCodeFinal}\``)
                    .setColor('GREEN');

                return interaction.editReply({ embeds: [replayEmbed] });
            }
        }

        return interaction.editReply({
            embeds: [
                errorEmbed(null,
                    'There is no game running in this channel! If you think this is a mistake, please contact a staff member.'
                ),
            ],
        });
    }
};