const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const config = require('../config.json');
const { errorEmbed } = require('../helper/embeds');

module.exports = {
    name: 'queuepanel',
    description: 'Queue Panel',
    async execute(discordClient, interaction) {
        const QUEUE_OPTIONS = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('queue')
                .setLabel('Queue')
                .setStyle('SUCCESS')
                .setEmoji('1111370531497848882'),
            new MessageButton()
                .setCustomId('unqueue')
                .setLabel('Unqueue')
                .setStyle('DANGER')
                .setEmoji('❌')
        );

        if (!interaction.member.roles.cache.some(role => role.id === config.roles.owner)) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'You do not have permission to use this command'),
                ],
            });
        }
        
        const queueembed = new MessageEmbed()
        .setColor('#065efc')
        .setTitle('Queue')
        .setDescription('To queue for a match, click the button below! \nSimply click unqueue to unqueue.')
        .setFooter({ text: 'BEAT Ranked | Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' });

        await interaction.channel.send({ embeds: [queueembed], components: [QUEUE_OPTIONS] });
        
        await interaction.editReply({ content: '.'});

        return interaction.deleteReply();
    }
};