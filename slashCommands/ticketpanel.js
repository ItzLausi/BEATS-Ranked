const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const config = require('../config.json');

module.exports = {
    name: 'ticketpanel',
    description: 'Ticket Panel',
    async execute(discordClient, interaction) {
        const TICKET_BUTTON = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('ticket').setLabel('Create Ticket').setStyle('SUCCESS').setEmoji('📩')
        );

        if (!interaction.member.roles.cache.some(role => role.id === config.roles.owner)) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'You do not have permission to use this command'),
                ],
            });
        }

        const ticketEmbed = new MessageEmbed()
        .setColor('#065efc')
        .setTitle('Tickets')
        .setDescription('To create a ticket simply click the button below and choose an option')
        .setFooter({ text: 'BEAT Ranked | Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })
        .setThumbnail('https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&');

        await interaction.channel.send({ embeds: [ticketEmbed], components: [TICKET_BUTTON] });
        
        await interaction.editReply({ content: '.'});

        return interaction.deleteReply();
    },
};