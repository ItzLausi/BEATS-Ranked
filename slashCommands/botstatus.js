const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const config = require('../config.json');

module.exports = {
    name: 'botstatus',
    description: 'Change the bot status',
    options: [
        {
            name: 'activity',
            description: 'Choose an activity',
            type: STRING,
            required: true,
        },
        {
            name: 'prefix',
            description: 'Choose a prefix',
            type: STRING,
            required: true,
            choices: [
                {
                    name: 'Watching',
                    value: 'WATCHING'
                },
                {
                    name: 'Playing',
                    value: 'PLAYING'
                },
                {
                    name: 'Listening',
                    value: 'LISTENING'
                },
                {
                    name: 'Streaming',
                    value: 'STREAMING'
                },
                {
                    name: 'Competing',
                    value: 'COMPETING'
                }
            ]
        },
        {
            name: 'status',
            description: 'Choose a status',
            type: STRING,
            required: true,
            choices: [
                {
                    name: 'Online',
                    value: 'online'
                },
                {
                    name: 'Idle',
                    value: 'idle'
                },
                {
                    name: 'Do not disturb',
                    value: 'dnd'
                },
                {
                    name: 'Invisible',
                    value: 'invisible'
                }
            ]
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

        const prefix = interaction.options.get('prefix')?.value;
        const status = interaction.options.get('status')?.value;
        const activity = interaction.options.get('activity')?.value;

        discordClient.user.setPresence({
            activities: [{
                name: activity,
                type: prefix
            }],
            status: status
        });

        const embed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle('Bot Status')
            .setDescription(`Successfully set bot status to ${prefix} ${activity}`);

        return interaction.editReply({
            embeds: [embed],
        });
    }
}; 