const fs = require('fs');
const config = require('../config.json');
const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const { sleep } = require('../helper/functions');

module.exports = {
    name: 'voidgame',
    description: 'Confirm or reject a void poll',
    options: [
        {
            name: 'confirm',
            description: 'Confirm a void poll',
            type: 'SUB_COMMAND',
        },
        {
            name: 'reject',
            description: 'Reject a void poll',
            type: 'SUB_COMMAND',
        },
    ],
    async execute(discordClient, interaction) {
        if (!interaction.member.roles.cache.some(role => role.id === config.roles.staff)) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'You do not have permission to use this command'),
                ],
            });
        }

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

        if (!voids[gameChannelId]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 
                        'There is no poll to void this game!'
                    ),
                ],
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'confirm') {
            delete voids[gameChannelId];
            fs.writeFileSync('./data/voids.json', JSON.stringify(voids, null, 4));

            const game = games.find(game => game.channelID === gameChannelId);
            game.void = true;
            fs.writeFileSync('./data/games.json', JSON.stringify(games, null, 4));

            const embed = new MessageEmbed()
                .setTitle('Game Voided')
                .setDescription(`Game has been voided successfully!`)
                .setColor('#065efc');

            await interaction.editReply({
                embeds: [embed],
            });

            await sleep(5000);

            const channel = interaction.channel;
            await channel.permissionOverwrites.set([]);
    
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { VIEW_CHANNEL: false });
            await channel.permissionOverwrites.edit(config.roles.staff, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, MANAGE_MESSAGES: true, MANAGE_CHANNELS: true, MANAGE_ROLES: true, ADD_REACTIONS: true});
    
            await channel.setName(`${channelName}-closed`);
    
            await channel.setParent(config.channels.archiveCategory);

            const closeembed = new MessageEmbed()
                .setColor('#065efc')

            closeembed.setDescription(`Game was closed by <@${interaction.user.id}>`)

            await channel.send({
                embeds: [
                    closeembed,
                ],
            });
        } else if (subcommand === 'reject') {
            delete voids[gameChannelId];
            fs.writeFileSync('./data/voids.json', JSON.stringify(voids, null, 4));

            const embed = new MessageEmbed()
                .setTitle('Game Not Voided')
                .setDescription(`Game has not been voided.`)
                .setColor('#065efc');

            return interaction.editReply({
                embeds: [embed],
            });
        }
    }
}