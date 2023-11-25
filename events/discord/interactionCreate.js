const { errorEmbed } = require('../../helper/embeds');
const config = require('../../config.json');
const fs = require('fs');
const { hypixelRequest, nameToUUID, n, shuffleArray, makeid, sleep } = require('../../helper/functions');
const { MessageSelectMenu, MessageActionRow, Modal, TextInputComponent, MessageEmbed, MessageButton } = require('discord.js');

module.exports = {
    execute: async (discordClient, interaction) => {
        if (interaction.customId === 'verify') {
            const links = JSON.parse(fs.readFileSync('./data/guildLinks.json'));

            if (interaction.member.roles.cache.has(config.roles.verified) || links[interaction.user.id]) {
                const unverifyembed = new MessageEmbed()
                    .setDescription(`⛔ <@${interaction.user.id}> is already verified!`)
                    .setColor('#ff0000')

                return interaction.reply({ embeds: [unverifyembed], ephemeral: true });
            }

            const modal = new Modal()
                .setCustomId('verifymodal')
                .setTitle('Enter your IGN')

            const textInput = new TextInputComponent()
                .setCustomId('verifyign')
                .setLabel('What is your IGN?')
                .setPlaceholder('Enter your IGN')
                .setStyle('SHORT')
                .setMinLength(1)
                .setRequired(true);

            const firstquestion = new MessageActionRow().addComponents(textInput);

            modal.addComponents(firstquestion);

            await interaction.showModal(modal);
        }

        if (interaction.customId === 'verifymodal') {
            await interaction.deferReply({ ephemeral: true});

            const verifyign = interaction.fields.getTextInputValue('verifyign');

            const links = JSON.parse(fs.readFileSync('./data/guildLinks.json'));

            const uuid = await nameToUUID(verifyign);
            if (!uuid) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(null, `${verifyign} is not a valid IGN!`),
                    ],
                });
            }

            const playerData = await hypixelRequest(`https://api.hypixel.net/player?uuid=${uuid}`, true);

            const displayname = playerData?.player?.displayname;
            const discord = playerData?.player?.socialMedia?.links?.DISCORD;
            if (!discord) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(null, `${displayname} does not have their discord linked!`),
                    ],
                });
            }

            const tag = interaction.user.tag;
            let modifiedTag = tag;

            if (tag.endsWith('#0')) {
                modifiedTag = tag.slice(0, -2);
            }

            if (discord !== modifiedTag) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(
                            null,
                            n(
                                `This player\'s discord link on hypixel (\`${discord}\`) does not match yours (\`${modifiedTag}\`). Join Hypixel and do the following steps in order to set/update your discord links:
                                
                                1. Click on \`My Profile (Right Click)\` in a Hypixel lobby
                                2. Click on \`Social Media\`
                                3. Left-click on \`Discord\`
                                4. Paste this in the Minecraft ingame chat: \`${modifiedTag}\``
                            )
                        ),
                    ],
                });
            }

            links[interaction.user.id] = uuid;
            fs.writeFileSync('./data/guildLinks.json', JSON.stringify(links, null, 2));

            const member = interaction.guild.members.cache.get(interaction.user.id);

            member.roles.add(config.roles.verified);
            member.roles.remove(config.roles.unverified);

            if (!interaction.user.id === config.owner) {
                member.setNickname(displayname);
            }
                
            const thumbnail = `https://crafatar.com/avatars/${uuid}?overlay=true`;

            const verifyembed = new MessageEmbed()
                .setTitle('Verification Successful')
                .setDescription(`<@${interaction.user.id}> is now verified! \n<:plus:1171542425211252776> <@&1174027557516087306> was added to <@${interaction.user.id}>`)
                .setColor('#00ff00')
                .setFooter({ text: 'Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })
                .setThumbnail(thumbnail);

            await interaction.editReply({ embeds: [verifyembed], ephemeral: true });
            return;
        }

        if (interaction.customId === 'unverify') {
            await interaction.deferReply({ ephemeral: true});

            if (interaction.member.roles.cache.has(config.roles.verified)) {
                const member = interaction.guild.members.cache.get(interaction.user.id);

                const links = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
                delete links[interaction.user.id];
                fs.writeFileSync('./data/guildLinks.json', JSON.stringify(links, null, 2));

                member.roles.remove(config.roles.verified);
                member.roles.add(config.roles.unverified);

                const unverifyembed = new MessageEmbed()
                    .setDescription(`✅ <@${interaction.user.id}> has been unverified!`)
                    .setColor('#00ff00')

                await interaction.editReply({ embeds: [unverifyembed], ephemeral: true });
                return;

            } else {
                const unverifyembed = new MessageEmbed()
                    .setDescription(`⛔ <@${interaction.user.id}> is already unverified!`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [unverifyembed], ephemeral: true });
                return;
            }
        }

        if (interaction.customId === 'partyaccept') {
            await interaction.deferReply({ ephemeral: true});

            const partyRequest = JSON.parse(fs.readFileSync('./data/partyRequest.json'));
            const partyTrue = JSON.parse(fs.readFileSync('./data/party.json'));
            const party = JSON.parse(fs.readFileSync('./data/party.json'));

            if (!partyRequest[interaction.user.id]) {
                const partyacceptembed = new MessageEmbed()
                    .setDescription(`⛔ There is no party request pending!`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [partyacceptembed], ephemeral: true });
                return;
            }

            const player1 = partyRequest[interaction.user.id].player1;
            const player2 = partyRequest[interaction.user.id].player2;

            if (party[player1] || party[player2]) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(null, `You or your partner are already in a party!`),
                    ],
                });
            }

            const player1uuid = partyRequest[interaction.user.id].player1uuid;
            const player2uuid = partyRequest[interaction.user.id].player2uuid;

            const player1displayname = (await hypixelRequest(`https://api.hypixel.net/player?uuid=${player1uuid}`, true))?.player?.displayname;
            const player2displayname = (await hypixelRequest(`https://api.hypixel.net/player?uuid=${player2uuid}`, true))?.player?.displayname;

            if (!player1displayname || !player2displayname) {
                const partyacceptembed = new MessageEmbed()
                    .setDescription(`⛔ An error occurred while accepting the party request! Please try again later.`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [partyacceptembed], ephemeral: true });
                return;
            }

            const partyacceptembed = new MessageEmbed()
                .setDescription(`✅ Successfully accepted party request from <@${player1}> (${player1displayname})!`)
                .setColor('#00ff00')

            const partyembed = new MessageEmbed()
                .setDescription(`Party leader: <@${player1}> (${player1displayname}) \nParty member: <@${player2}> (${player2displayname})`)
                .setTitle(`${player1displayname}'s Party`)
                .setColor('#00ff00')
                .setFooter({ text: 'Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })
            
            await interaction.editReply({ embeds: [partyacceptembed], ephemeral: true });
            await interaction.channel.send({ embeds: [partyembed], content: `<@${player1}> <@${player2}>` });


            let partyListHistory = [];

            try {
                const exisitingData = JSON.parse(fs.readFileSync('./data/partyList.json'));
                partyListHistory = exisitingData;
            } catch (e) {}

            partyListHistory.push({
                leader: player1,
                member: player2,
                leaderuuid: player1uuid,
                memberuuid: player2uuid,
            });
            fs.writeFileSync('./data/partyList.json', JSON.stringify(partyListHistory, null, 2));

            partyTrue[player1] = true;
            fs.writeFileSync('./data/party.json', JSON.stringify(partyTrue, null, 2));
            const partyTrue2 = JSON.parse(fs.readFileSync('./data/party.json'));
            partyTrue2[player2] = true;
            fs.writeFileSync('./data/party.json', JSON.stringify(partyTrue2, null, 2));

            delete partyRequest[interaction.user.id];
            fs.writeFileSync('./data/partyRequest.json', JSON.stringify(partyRequest, null, 2));

            return;
        }

        if (interaction.customId === 'partydeny') {
            await interaction.deferReply({ ephemeral: true});

            const partyRequest = JSON.parse(fs.readFileSync('./data/partyRequest.json'));

            if (!partyRequest[interaction.user.id]) {
                const partydenyembed = new MessageEmbed()
                    .setDescription(`⛔ There is no party request pending!`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [partydenyembed], ephemeral: true });
                return;
            }

            const player1 = partyRequest[interaction.user.id].player1;

            const player1uuid = partyRequest[interaction.user.id].player1uuid;

            const player1displayname = (await hypixelRequest(`https://api.hypixel.net/player?uuid=${player1uuid}`, true))?.player?.displayname;

            if (!player1displayname) {
                const partydenyembed = new MessageEmbed()
                    .setDescription(`⛔ An error occurred while denying the party request! Please try again later.`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [partydenyembed], ephemeral: true });
                return;
            }

            const partydenyembed = new MessageEmbed()
                .setDescription(`⛔ Successfully denied party request from <@${player1}> (${player1displayname})!`)
                .setColor('#ff0000')

            await interaction.editReply({ embeds: [partydenyembed], ephemeral: true });

            delete partyRequest[interaction.user.id];
            fs.writeFileSync('./data/partyRequest.json', JSON.stringify(partyRequest, null, 2));

            return;
        }

        if (interaction.customId === 'queue') {
            await interaction.deferReply({ ephemeral: true});

            const queue = JSON.parse(fs.readFileSync('./data/queue.json'));
            const partyList = JSON.parse(fs.readFileSync('./data/partyList.json'));

            if (queue[interaction.user.id]) {
                const queueembed = new MessageEmbed()
                    .setDescription(`⛔ You and your partner are already in the queue!`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [queueembed], ephemeral: true });
                return;
            }

            for (const party of partyList) {
                if (party.leader === interaction.user.id || party.member === interaction.user.id) {
                    const leader = party.leader;
                    const member = party.member;

                    queue[leader] = true;
                    queue[member] = true;

                    fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, 2));

                    const queueembed = new MessageEmbed()
                        .setDescription(`✅ Successfully added <@${leader}> and <@${member}> to the queue!`)
                        .setColor('#00ff00')

                    await interaction.editReply({ embeds: [queueembed], ephemeral: true });
                }
            }

            if (!partyList.find((party) => party.leader === interaction.user.id || party.member === interaction.user.id)) {
                const queueembed = new MessageEmbed()
                    .setDescription(`⛔ You are not in a party! Please use \`/party\` to create a party.`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [queueembed], ephemeral: true });
            }

            const queueLength = Object.keys(queue).length;
            if (queueLength >= 16) {
                let uuids = [];
                let discordids = [];

                const guildLinks = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
                const gameIDs = JSON.parse(fs.readFileSync('./data/gameIDs.json'));

                for (let i = 0; i < 16; i++) {
                    const player = Object.keys(queue)[i];
                    uuids.push(queue[player]);

                    const discordid = Object.keys(guildLinks).find((key) => guildLinks[key] === queue[player]);
                    discordids.push(discordid);

                    delete queue[player];
                }

                fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, 2));

                shuffleArray(uuids);

                const teams = [[], [], [], []];
                for (let i = 0; i < uuids.length; i++) {
                    const teamIndex = i % 4;
                    teams[teamIndex].push(uuids[i]);
                }

                const team1 = teams[0];
                const team2 = teams[1];
                const team3 = teams[2];
                const team4 = teams[3];

                const team1discordids = [];
                const team2discordids = [];
                const team3discordids = [];
                const team4discordids = [];

                for (const uuid of team1) {
                    const discordid = Object.keys(guildLinks).find((key) => guildLinks[key] === uuid);
                    team1discordids.push(discordid);
                }

                for (const uuid of team2) {
                    const discordid = Object.keys(guildLinks).find((key) => guildLinks[key] === uuid);
                    team2discordids.push(discordid);
                }

                for (const uuid of team3) {
                    const discordid = Object.keys(guildLinks).find((key) => guildLinks[key] === uuid);
                    team3discordids.push(discordid);
                }

                for (const uuid of team4) {
                    const discordid = Object.keys(guildLinks).find((key) => guildLinks[key] === uuid);
                    team4discordids.push(discordid);
                }

                let gameID = makeid(10);

                if (gameIDs[gameID]) {
                    gameID = makeid(10);
                }
                    
                gameIDs[gameID] = true;
                fs.writeFileSync('./data/gameIDs.json', JSON.stringify(gameIDs, null, 2));

                const channel = await interaction.guild.channels.create(`game-${gameID}`, {
                    type: 'GUILD_TEXT',
                    topic: `${gameID}`,
                    parent: config.channels.gameCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: config.roles.staff,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'MANAGE_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'ADD_REACTIONS'],
                        },
                        ...discordids.map((id) => ({
                            id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS'],
                        })),
                    ],
                });

                const voiceChannelTeam1 = await interaction.guild.channels.create(`Team 1-${gameID}`, {
                    type: 'GUILD_VOICE',
                    parent: config.channels.gameCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: config.roles.staff,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'MOVE_MEMBERS'],
                        },
                        ...team1discordids.map((id) => ({
                            id,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD'],
                        })),
                    ],
                });

                const voiceChannelTeam2 = await interaction.guild.channels.create(`Team 2-${gameID}`, {
                    type: 'GUILD_VOICE',
                    parent: config.channels.gameCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: config.roles.staff,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'MOVE_MEMBERS'],
                        },
                        ...team2discordids.map((id) => ({
                            id,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD'],
                        })),
                    ],
                });

                const voiceChannelTeam3 = await interaction.guild.channels.create(`Team 3-${gameID}`, {
                    type: 'GUILD_VOICE',
                    parent: config.channels.gameCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: config.roles.staff,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'MOVE_MEMBERS'],
                        },
                        ...team3discordids.map((id) => ({
                            id,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD'],
                        })),
                    ],
                });

                const voiceChannelTeam4 = await interaction.guild.channels.create(`Team 4-${gameID}`, {
                    type: 'GUILD_VOICE',
                    parent: config.channels.gameCategory,
                    permissionOverwrites: [
                        {
                            id: config.roles.everyone,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: config.roles.staff,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'MOVE_MEMBERS'],
                        },
                        ...team4discordids.map((id) => ({
                            id,
                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD'],
                        })),
                    ],
                });

                let mvpplusplus = false;
                for (const uuid of uuids) {
                    const playerData = await hypixelRequest(`https://api.hypixel.net/player?uuid=${uuid}`, true);
                    
                    if (playerData.player.monthlyPackageRank && playerData.player.monthlyPackageRank !== 'NONE') {
                        mvpplusplus = true;
                    }
                }

                channel.send({ content: `@everyone` });

                channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle(`Game ${gameID}`)
                            .setDescription(`MVP++: ${mvpplusplus ? '✅' : '❌'} \n\n**Team 1** \n${team1discordids.map((id) => `<@${id}>`).join('\n')} \n\n**Team 2** \n${team2discordids.map((id) => `<@${id}>`).join('\n')} \n\n**Team 3** \n${team3discordids.map((id) => `<@${id}>`).join('\n')} \n\n**Team 4** \n${team4discordids.map((id) => `<@${id}>`).join('\n')}`)
                            .setColor('#00ff00')
                            .setFooter({ text: 'Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })
                    ],
                });

                if (!mvpplusplus) {
                    channel.send({ content: `<@&${config.roles.staff}>` });
                }

                for (const discordid of team1discordids) {
                    const member = interaction.guild.members.cache.get(discordid);
                    member.voice.setChannel(voiceChannelTeam1);
                }

                for (const discordid of team2discordids) {
                    const member = interaction.guild.members.cache.get(discordid);
                    member.voice.setChannel(voiceChannelTeam2);
                }

                for (const discordid of team3discordids) {
                    const member = interaction.guild.members.cache.get(discordid);
                    member.voice.setChannel(voiceChannelTeam3);
                }

                for (const discordid of team4discordids) {
                    const member = interaction.guild.members.cache.get(discordid);
                    member.voice.setChannel(voiceChannelTeam4);
                }

                let games = [];

                try {
                    const exisitingData = JSON.parse(fs.readFileSync('./data/games.json'));
                    games = exisitingData;
                } catch (e) {}

                games.push({
                    gameID,
                    channelID: channel.id,
                    replayCode: null,
                    uuids,
                });
                fs.writeFileSync('./data/games.json', JSON.stringify(games, null, 2));

                return;

            } else {
                return;
            }
        }

        if (interaction.customId === 'unqueue') {
            await interaction.deferReply({ ephemeral: true});

            const queue = JSON.parse(fs.readFileSync('./data/queue.json'));
            const partyList = JSON.parse(fs.readFileSync('./data/partyList.json'));

            if (!queue[interaction.user.id]) {
                const queueembed = new MessageEmbed()
                    .setDescription(`⛔ You and your partner are not in the queue!`)
                    .setColor('#ff0000')

                await interaction.editReply({ embeds: [queueembed], ephemeral: true });
                return;
            }

            for (const party of partyList) {
                if (party.leader === interaction.user.id || party.member === interaction.user.id) {
                    const leader = party.leader;
                    const member = party.member;

                    delete queue[leader];
                    delete queue[member];

                    fs.writeFileSync('./data/queue.json', JSON.stringify(queue, null, 2));

                    const queueembed = new MessageEmbed()
                        .setDescription(`✅ Successfully removed <@${leader}> and <@${member}> from the queue!`)
                        .setColor('#00ff00')

                    return interaction.editReply({ embeds: [queueembed], ephemeral: true });
                }
            }

            if (!partyList.find((party) => party.leader === interaction.user.id || party.member === interaction.user.id)) {
                const queueembed = new MessageEmbed()
                    .setDescription(`⛔ You are not in a party! Please use \`/party\` to create a party.`)
                    .setColor('#ff0000')

                return interaction.editReply({ embeds: [queueembed], ephemeral: true });
            }
        }

        if (interaction.customId === 'ticket') {
            await interaction.deferReply({ ephemeral: true });

            const dropdown = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId('ticketmenu')
                    .setPlaceholder('Select an option')
                    .addOptions([
                        {
                            label: 'Failed scoring',
                            description: 'Choose this if you believe your score was not counted correctly',
                            value: '1',
                            emoji: '❌',
                        },
                        {
                            label: 'Bug report',
                            description: 'Choose this if you found a bug',
                            value: '2',
                            emoji: '🐛',
                        },
                        {
                            label: 'Party change',
                            description: 'Choose this if you want to change your party',
                            value: '3',
                            emoji: '👥',
                        },
                        {
                            label: 'Question',
                            description: 'Choose this if you have a question',
                            value: '4',
                            emoji: '❓',
                        },
                        {
                            label: 'Other',
                            description: 'Choose this if your reason is not listed above',
                            value: '5',
                            emoji: '🤷‍♂️',
                        },
                    ])
            );

            await interaction.editReply({ content: 'Please choose an option below', components: [dropdown], ephemeral: true });

        }

        if (interaction.customId === 'ticketmenu') {
            await interaction.deferReply({ ephemeral: true });

            const ticketoption = interaction.values[0];

            const guildLinks = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
            const uuid = guildLinks[interaction.user.id];

            const displayname = (await hypixelRequest(`https://api.hypixel.net/player?uuid=${uuid}`, true))?.player?.displayname;
            if (!displayname) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(null, `An error occurred while fetching your IGN!`),
                    ],
                });
            }

            const alrchannel = interaction.guild.channels.cache.find(channel => channel.name === `${displayname.toLowerCase()}s-ticket`);
            if (alrchannel) {
                if (!interaction.member.roles.cache.has(config.roles.staff)) {
                    const embed = new MessageEmbed()
                        .setTitle('Warning')
                        .setDescription(`You can only have 1 ticket open at a time! \nYou already have <#${alrchannel.id}>`)

                    return interaction.editReply({ embeds: [embed], ephemeral: true })
                }
            }

            const channel = await interaction.guild.channels.create(`${displayname}s-ticket`, {
                type: 'GUILD_TEXT',
                parent: config.channels.ticketCategory,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: config.roles.staff,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'MANAGE_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'ADD_REACTIONS'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS'],
                    },
                ],
            });

            channel.send({ content: `<@${interaction.user.id}> Thank you for opening a ticket, a staff member will be with you shortly! \n<@&${config.roles.staff}>` });

            const ticketembed = new MessageEmbed()
                .setTitle(`Ticket - ${displayname}`)
                .setColor('#065efc')
                .setFooter({ text: 'Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })

            if (ticketoption === '1') {
                ticketembed.setDescription(`${displayname} chose the option **Failed scoring**
                \nIn order for us to help you, please answer the following questions:
                \n**What went wrong?** Please explain in detail
                \n**Do you have any proof?** If so, please provide it`)
            } else if (ticketoption === '2') {
                ticketembed.setDescription(`${displayname} chose the option **Bug report**
                \n**What is the bug?** Please explain in detail
                \n**Is this bug reproducable?** If so, please explain how`)
            } else if (ticketoption === '3') {
                ticketembed.setDescription(`${displayname} chose the option **Party change**
                \n**Who is your current party member?** Please provide their IGN
                \n**Who do you want to party with?** Please provide their IGN
                \n**Why do you want to change your party?** Please explain in detail`)
            } else if (ticketoption === '4') {
                ticketembed.setDescription(`${displayname} chose the option **Question**
                \nPlease ask your question below and a staff member will be with you shortly!`)
            } else if (ticketoption === '5') {
                ticketembed.setDescription(`${displayname} chose the option **Other**
                \nPlease explain your situation below and a staff member will be with you shortly!`)
            }

            const TICKET_OPTIONS = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('close')
                    .setLabel('Close')
                    .setStyle('DANGER')
                    .setEmoji('🔒')
            );

            channel.send({ embeds: [ticketembed], components: [TICKET_OPTIONS] });

            await interaction.editReply({ content: `Your ticket has been created <#${channel.id}>`, ephemeral: true });

            return;
        }

        if (interaction.customId === 'close') {
            await interaction.deferReply();

            const channel = interaction.channel;
            await channel.permissionOverwrites.set([]);

            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { VIEW_CHANNEL: false });

            await channel.permissionOverwrites.edit(config.roles.staff, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, MANAGE_MESSAGES: true, MANAGE_CHANNELS: true, MANAGE_ROLES: true, ADD_REACTIONS: true});
            await channel.permissionOverwrites.edit(config.roles.staff, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, MANAGE_MESSAGES: true, MANAGE_CHANNELS: true, MANAGE_ROLES: true, ADD_REACTIONS: true});

            const channelname = channel.name;

            const embed = new MessageEmbed()
                .setColor('#065efc')
                .setFooter({ text: 'Made by ItzLausi', iconURL: 'https://cdn.discordapp.com/attachments/933818844080910386/1174753739459018812/1024px-Magicdelivery_gaming_logo.png?ex=6568bdad&is=655648ad&hm=72df62395258bcf3eacc984bad2fead28f1557624b0c92766384446b30fbe3cc&' })

            const deletedembed = new MessageEmbed()
                .setColor('#065efc')


            const newname = channelname.replace('s-ticket', '-closed');
            await channel.setName(newname);

            deletedembed.setDescription(`Ticket was closed by <@${interaction.user.id}>`)

            embed.setDescription('This ticket has been closed. If you would like to delete it, please click the button below.')
            embed.setTitle('Ticket Closed')

            const DEL_OPTIONS = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('delete')
                    .setLabel('Delete')
                    .setStyle('DANGER')
                    .setEmoji('🗑️')
            );

            interaction.editReply({ embeds: [deletedembed] });

            channel.send({ embeds: [embed], components: [DEL_OPTIONS] });
        }

        if (interaction.customId === 'delete') {
            await interaction.deferReply({ ephemeral: true});

            const channel = interaction.channel;

            await interaction.editReply({ content: 'This ticket will be deleted soon!', ephemeral: true });

            await sleep(3000);

            channel.delete();
        }

        if (interaction.customId === 'void') {
            await interaction.deferReply({ ephemeral: true});

            const gameChannelId = interaction.channel.id;

            const voids = JSON.parse(fs.readFileSync('./data/voids.json'));

            if (!voids[gameChannelId]) {
                return interaction.editReply({
                    embeds: [
                        errorEmbed(null, 'There is no poll to void this game!')
                    ],
                });
            }

            voids[gameChannelId]++;
            fs.writeFileSync('./data/voids.json', JSON.stringify(voids, null, 2));

            if (voids[gameChannelId] >= 10) {
                const voidEmbed = new MessageEmbed()
                    .setColor('#065efc')
                    .setTitle('Void Game')
                    .setDescription(`<@${config.roles.staff}> Please look at the replay of the game and decide whether or not to void the game.`)

                await interaction.channel.send({ embeds: [voidEmbed], content: `<@&${config.roles.staff}>` });
            }
        }
            
        if (interaction.user.bot) return;
        if (!interaction.guildId) return; // DMs
        if (interaction.type !== 'APPLICATION_COMMAND') return;

        const cmd = interaction.commandName;
        const command = discordClient.commands.get(cmd);
        if (!command) return;
        await interaction.deferReply();

        command.execute(discordClient, interaction).catch((e) => {
            console.error(e);
            return interaction.editReply({
                embeds: [errorEmbed(null, 'An error occurred while executing this command.')],
            });
        });
    },
};