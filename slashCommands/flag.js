const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../helper/embeds');
const { Constants } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const fs = require('fs');
const { nameToUUID, sleep, dmUser, UUIDtoName } = require('../helper/functions');
const config = require('../config.json');

module.exports = {
    name: 'flag',
    description: 'Flag a player',
    options: [
        {
            name: 'username',
            description: 'Username of the player to flag',
            type: STRING,
            required: true,
        },
        {
            name: 'reason',
            description: 'Reason for the flag',
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

        const username = interaction.options.getString('username');
        const reason = interaction.options.getString('reason');

        const uuid = await nameToUUID(username);
        if (!uuid) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(null, 'That player does not exist'),
                ],
            });
        }

        const displayname = await UUIDtoName(uuid);

        const flags = JSON.parse(fs.readFileSync('./data/flags.json'));
        if (flags[uuid]) {
            flags[uuid].count++;
            flags[uuid].reasons.push(reason);
        } else {
            flags[uuid] = {
                count: 1,
                reasons: [reason],
            };
        }

        fs.writeFileSync('./data/flags.json', JSON.stringify(flags));

        if (flags[uuid].count >= 3) {
            const embed = new MessageEmbed()
                .setColor('#065efc')
                .setTitle('3 Flags')
                .setDescription(`**${displayname}** has been flagged 3 times. Please look into this.`)
                .setFooter({ text: 'BEAT Ranked | Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' });
            
            const flagChannel = discordClient.channels.cache.get(config.channels.flags);
            await flagChannel.send({ embeds: [embed] });
        }


        const guildLinks = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
        const discordid = Object.keys(guildLinks).find((key) => guildLinks[key] === uuid);
        if (discordid) {
            await dmUser(discordClient, discordid, `You have been flagged for ${reason}`);
        }

        const embed = new MessageEmbed()
            .setColor('#065efc')
            .setTitle('Flag')
            .setDescription(`Flagged ${displayname} for ${reason}`)
            .setFooter({ text: 'BEAT Ranked | Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' });

        await interaction.editReply({ embeds: [embed] });

        await sleep(5000);

        return interaction.deleteReply();
    }
};