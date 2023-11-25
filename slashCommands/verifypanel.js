const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const config = require('../config.json');
const { errorEmbed } = require('../helper/embeds');

module.exports = {
    name: 'verifypanel',
    description: 'Verify Panel',
    async execute(discordClient, interaction) {
        const VERIFY_OPTIONS = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('verify')
                .setLabel('Verify')
                .setStyle('SUCCESS')
                .setEmoji('✅'),
            new MessageButton()
                .setCustomId('unverify')
                .setLabel('Unverify')
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
        
        const verifyembed = new MessageEmbed()
        .setColor('#065efc')
        .setTitle('Verification')
        .setDescription('Welcome to the BEAT Ranked Server! \n\n**To gain access to all public channels, click the button below!** \nDM <@710163156818722886> if you need any help!')
        .setFooter({ text: 'BEAT Ranked | Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })
        .setThumbnail('https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&');

        await interaction.channel.send({ embeds: [verifyembed], components: [VERIFY_OPTIONS] });
        
        await interaction.editReply({ content: '.'});

        return interaction.deleteReply();
    },
};