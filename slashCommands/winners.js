const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const fs = require('fs');
const { nameToUUID, sleep } = require('../helper/functions');
const config = require('../config.json');

module.exports = {
    name: 'winners',
    description: 'Determines the winners of a game',
    options: [
        {
            name: 'username',
            description: 'winner 1',
            type: STRING,
            required: true,
        },
        {
            name: 'username2',
            description: 'winner 2',
            type: STRING,
            required: true,
        },
        {
            name: 'username3',
            description: 'winner 3',
            type: STRING,
            required: true,
        },
        {
            name: 'username4',
            description: 'winner 4',
            type: STRING,
            required: true,
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

        const score = JSON.parse(fs.readFileSync('./data/score.json'));

        const winner1 = interaction.options.getString('username');
        const winner2 = interaction.options.getString('username2');
        const winner3 = interaction.options.getString('username3');
        const winner4 = interaction.options.getString('username4');

        const uuid1 = await nameToUUID(winner1);
        const uuid2 = await nameToUUID(winner2);
        const uuid3 = await nameToUUID(winner3);
        const uuid4 = await nameToUUID(winner4);

        if (!uuid1 || !uuid2 || !uuid3 || !uuid4) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'One of the players does not exist'),
                ],
            });
        }

        const points = 3;

        if (score[uuid1]) {
            score[uuid1] += points;
        } else {
            score[uuid1] = points;
        }

        if (score[uuid2]) {
            score[uuid2] += points;
        } else {
            score[uuid2] = points;
        }

        if (score[uuid3]) {
            score[uuid3] += points;
        } else {
            score[uuid3] = points;
        }

        if (score[uuid4]) {
            score[uuid4] += points;
        } else {
            score[uuid4] = points;
        }

        fs.writeFileSync('./data/score.json', JSON.stringify(score));

        const channelName = interaction.channel.name;

        const gameID = channelName.split('-')[1];

        const embed = new MessageEmbed()
            .setTitle('Winners')
            .setColor('#065efc')
            .setDescription(`Winners of the game **${gameID}**: ${winner1}, ${winner2}, ${winner3}, ${winner4}`);

        await interaction.editReply({
            embeds: [
                embed,
            ],
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
    },
};