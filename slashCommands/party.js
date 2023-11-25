const fs = require('fs');
const { errorEmbed } = require('../helper/embeds');
const { nameToUUID } = require('../helper/functions');
const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;

module.exports = {
    name: 'party',
    description: 'Party with a player',
    options: [
        {
            name: 'username',
            description: 'Minecraft username you want to party with',
            type: STRING,
            required: true,
        },
    ],
    async execute(discordClient, interaction) {
        const PARTY_OPTIONS = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('partyaccept')
                .setLabel('Accept Party')
                .setStyle('SUCCESS')
                .setEmoji('✅'),
            new MessageButton()
                .setCustomId('partydeny')
                .setLabel('Deny Party')
                .setStyle('DANGER')
                .setEmoji('❌')
        );

        const name = interaction.options.getString('username');
        const uuid = await nameToUUID(name);
        if (!uuid) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `${name} is not a valid IGN!`),
                ],
            });
        }

        const links = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
        const partyRequest = JSON.parse(fs.readFileSync('./data/partyRequest.json'));
        const party = JSON.parse(fs.readFileSync('./data/party.json'));

        const partner = Object.keys(links).find(key => links[key] === uuid);

        if (!links[interaction.user.id]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `You are not verified!`),
                ],
            });
        }

        if (links[interaction.user.id] === uuid) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `You cannot party with yourself!`),
                ],
            });
        }

        if (partyRequest[interaction.user.id] || partyRequest[partner]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `There is already a party request pending!`),
                ],
            });
        }

        if (party[interaction.user.id] || party[partner]) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `You or your partner are already in a party!`),
                ],
            });
        }

        if (!partner) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `${name} is not verified!`),
                ],
            });
        }

        const partnerMember = await interaction.guild.members.fetch(partner);
        if (!partnerMember) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, `${name} is not in the server!`),
                ],
            });
        }

        const partyRequestData = {
            player1: interaction.user.id,
            player2: partner,
            player1uuid: links[interaction.user.id],
            player2uuid: links[partner],
        };

        partyRequest[partner] = partyRequestData;
        fs.writeFileSync('./data/partyRequest.json', JSON.stringify(partyRequest, null, 2));

        return interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor('#065efc')
                    .setTitle('Party Request')
                    .setDescription(`<@${interaction.user.id}> wants to party with <@${partner}>!`)
                    .setFooter({ text: 'BEAT Ranked | Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' }),
            ],
            components: [PARTY_OPTIONS],
            content: `<@${interaction.user.id}> <@${partner}>`,
        });
    }
};