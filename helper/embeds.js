const { MessageEmbed } = require('discord.js');

function errorEmbed(title, message) {
    return new MessageEmbed()
        .setTitle(title || 'Error')
        .setDescription(message || 'An error has occurred.')
        .setColor('RED')
        .setFooter({ text: 'Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })
}

module.exports = {
    errorEmbed,
};