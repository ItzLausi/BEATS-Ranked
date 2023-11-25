const Canvas = require('canvas');
Canvas.registerFont('./fonts/MinecraftRegular-Bmg3.ttf', { family: 'Minecraft' });
Canvas.registerFont('./fonts/unifont.ttf', { family: 'MinecraftUnicode' });
const { nameColor, hypixelRequest, sleep } = require('../helper/functions.js');
const { MessageAttachment } = require('discord.js');
const fs = require('fs');

const RGBA_COLOR = {
    0: 'rgba(0,0,0,1)',
    1: 'rgba(0,0,170,1)',
    2: 'rgba(0,170,0,1)',
    3: 'rgba(0,170,170,1)',
    4: 'rgba(170,0,0,1)',
    5: 'rgba(170,0,170,1)',
    6: 'rgba(255,170,0,1)',
    7: 'rgba(170,170,170,1)',
    8: 'rgba(85,85,85,1)',
    9: 'rgba(85,85,255,1)',
    a: 'rgba(85,255,85,1)',
    b: 'rgba(85,255,255,1)',
    c: 'rgba(255,85,85,1)',
    d: 'rgba(255,85,255,1)',
    e: 'rgba(255,255,85,1)',
    f: 'rgba(255,255,255,1)',
};

function generateLeaderboardImage(message) {
    const lines = message.split(',');

    const canvas = Canvas.createCanvas(1000, lines.length * 39 + 10);
    const ctx = canvas.getContext('2d');
    let width = 5;
    let height = 29;

    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const splitMessageSpace = lines[i].split(' ');

        for (const [j, msg] of Object.entries(splitMessageSpace)) {
            if (!msg.startsWith('§')) splitMessageSpace[j] = `§r${msg}`;
        }

        const splitMessage = splitMessageSpace.join(' ').split(/§|\n/g);
        splitMessage.shift();
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.shadowColor = '#131313';
        ctx.font = `40px Minecraft, MinecraftUnicode`;

        for (const msg of splitMessage) {
            const colorCode = RGBA_COLOR[msg.charAt(0)];
            const currentMessage = msg.substring(1);
            if (colorCode) {
                ctx.fillStyle = colorCode;
            }
            ctx.fillText(currentMessage, width, height);
            width += ctx.measureText(currentMessage).width;
        }
        width = 5;
        height += 40;
    }

    return canvas.toBuffer();
}

async function generateLeaderboard(discordClient, channel, order) {
    const leaderboard = [];

    if (order === 'score') {
        const score = JSON.parse(fs.readFileSync('./data/score.json').toString());
        const partyList = JSON.parse(fs.readFileSync('./data/partyList.json').toString());

        let duos = [];

        for (const uuid in score) {
            if (duos.find((duo) => duo.uuid === uuid || duo.uuid2 === uuid)) continue;

            let memberUUID = '';
            for (const party of partyList) {
                if (party.leaderuuid === uuid) {
                    memberUUID = party.memberuuid;
                    continue;
                } else if (party.memberuuid === uuid) {
                    memberUUID = party.leaderuuid;
                    continue;
                }
            }

            duos.push({
                uuid: uuid,
                uuid2: memberUUID,
                score: score[uuid],
            });
        }

        duos.sort((a, b) => b.score - a.score);

        duos.slice(0, 10);

        let position = 1;

        for (const duo of duos) {
            const playerData1 = (await hypixelRequest(`https://api.hypixel.net/player?uuid=${duo.uuid}`, true))?.player;
            if (!playerData1) continue;
            const playerData2 = (await hypixelRequest(`https://api.hypixel.net/player?uuid=${duo.uuid2}`, true))?.player;
            if (!playerData2) continue;

            const player = {
                score: duo.score,
                nameColor: nameColor(playerData1),
                nameColor2: nameColor(playerData2),
                position: position,
            };
            
            leaderboard.push(player);
            position++;
        }
    }

    const lbChannel = discordClient.channels.cache.get(channel);

    const messageArray = [];
    const messages = await lbChannel.messages.fetch({ limit: 100 });
    messages.forEach((message) => messageArray.push(message));

    const updatedMessageCount = Math.ceil(leaderboard.length / 15);
    const existingMessageCount = messages.size;

    const messagesArray = Array.from(messages.values());

    const messagesToDelete = existingMessageCount - updatedMessageCount;

    if (messagesToDelete < 0) {
        for (const message of messagesArray) {
            await message.delete();
        }
    }
    
    for (let i = 0; i < leaderboard.length; i += 15) {
        let message = '';

        if (order === 'score') {
            message = leaderboard.slice(i, i + 15).map((player) => `§e${player.position}. §${player.nameColor} §r§7+ §${player.nameColor2} §r§7- §e${player.score}`).join(',');
        }

        const content = i === 0 ? `**Last Update**: <t:${Math.floor(Date.now() / 1000)}:R>` : ' ';
        const attachment = new MessageAttachment(generateLeaderboardImage(message), `leaderboard.png`);

        if (messagesToDelete < 0) {
            await lbChannel.send({
                content: content,
                files: [attachment],
            });
        } else {
            const existingMessage = messageArray.pop();
            await existingMessage.edit({
                content: content,
                files: [attachment],
            });
        }
    }

    if (messagesToDelete > 0) {
        for (let i = 0; i < messagesToDelete; i++) {
            await messagesArray[i].delete();
        }
    }
}

async function leaderboards(discordClient) {
    setInterval(async () => {
        await generateLeaderboard(discordClient, '1174032582741086238', 'score');
    }, 1000 * 60 * 5); // 5 minutes
}

module.exports = leaderboards;