const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'donate',
    description: 'Redirects to the donation page',
    options: [],
    async execute(discordClient, interaction) {
        const embed = new MessageEmbed()
            .setTitle('Donate to charities')
            .setDescription('You can donate to charities by clicking [here](https://electusmc.com/)')
            .setColor('#065efc')

        await interaction.editReply({
            embeds: [embed],
        });
    }
};