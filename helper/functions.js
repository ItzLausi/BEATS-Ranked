const axios = require('axios');
const { MessageButton, MessageActionRow } = require('discord.js');
const config = require('../config.json');

async function hypixelRequest(url, useKey) {
    try {
        if (useKey) {
            return (await axios.get(url, { headers: { 'API-Key': config.keys.hypixelApiKey } })).data;
        } else {
            return (await axios.get(url)).data;
        }
    } catch (e) {
        return null;
    }
}

async function nameToUUID(name) {
    try {
        return (await axios.get(`https://api.mojang.com/users/profiles/minecraft/${name}`)).data.id;
    } catch (e) {
        return null;
    }
}

async function UUIDtoName(uuid) {
    try {
        return (await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)).data.name;
    } catch (e) {
        return null;
    }
}

function numberformatter(num, num2) {
    num = Number(num);
    if (num > 999999999999)
        return Math.abs(num) > 999999999999 ? Math.sign(num) * (Math.abs(num) / 1000000000000).toFixed(num2) + 'T' : Math.sign(num) * Math.abs(num);
    if (num > 999999999)
        return Math.abs(num) > 999999999 ? Math.sign(num) * (Math.abs(num) / 1000000000).toFixed(num2) + 'B' : Math.sign(num) * Math.abs(num);
    if (num > 999999) return Math.abs(num) > 999999 ? Math.sign(num) * (Math.abs(num) / 1000000).toFixed(num2) + 'M' : Math.sign(num) * Math.abs(num);
    if (num > 999) return Math.abs(num) > 999 ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(num2) + 'K' : Math.sign(num) * Math.abs(num);
    if (num <= 999) return num.toFixed(0);
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function addCommas(num) {
    try {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch (err) {
        return 0;
    }
}

function addPoints(num) {
    try {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } catch (err) {
        return 0;
    }
}

function n(string) {
    const result = string.split(/\r?\n/).map((row) => row.trim().split(/\s+/).join(' '));
    return result.join('\n').trim();
}

function toFixed(num, fixed) {
    let re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function hypixelLevel(exp) {
    // CREDIT: https://github.com/slothpixel/core/blob/c158ba49a9053ee7398195ef8baa1a7a2c36c570/util/calculateLevel.js
    const BASE = 10000;
    const GROWTH = 2500;
    const REVERSE_PQ_PREFIX = -(BASE - 0.5 * GROWTH) / GROWTH;
    const REVERSE_CONST = REVERSE_PQ_PREFIX * REVERSE_PQ_PREFIX;
    const GROWTH_DIVIDES_2 = 2 / GROWTH;

    return exp <= 1 ? 1 : Math.floor(1 + REVERSE_PQ_PREFIX + Math.sqrt(REVERSE_CONST + GROWTH_DIVIDES_2 * exp));
}

async function paginator(interaction, embeds) {
    const BUTTONS = [
        new MessageButton().setEmoji('⬅️').setStyle('PRIMARY').setCustomId('back').setDisabled(true),
        new MessageButton().setEmoji('➡️').setStyle('PRIMARY').setCustomId('forward'),
    ];

    if (embeds.length == 1) BUTTONS[1].setDisabled(true);

    let selectedPage = 1;
    const reply = await interaction.editReply({
        embeds: [embeds[selectedPage - 1]],
        components: [new MessageActionRow().addComponents(BUTTONS[0], BUTTONS[1])],
    });

    const collector = reply.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 1000 * 60 });

    collector.on('collect', async (i) => {
        collector.resetTimer();
        switch (i.customId) {
            case 'back':
                selectedPage -= 1;
                break;
            case 'forward':
                selectedPage += 1;
                break;
        }
        if (selectedPage <= 1) {
            selectedPage = 1;
            BUTTONS[0].setDisabled(true);
            BUTTONS[1].setDisabled(false);
        } else if (selectedPage >= embeds.length) {
            selectedPage = embeds.length;
            BUTTONS[0].setDisabled(false);
            BUTTONS[1].setDisabled(true);
        } else {
            BUTTONS[0].setDisabled(false);
            BUTTONS[1].setDisabled(false);
        }
        await interaction.editReply({
            embeds: [embeds[selectedPage - 1]],
            components: [new MessageActionRow().addComponents(BUTTONS[0], BUTTONS[1])],
        });
        await i.deferUpdate();
    });
}

const rankColor = {
    DARK_BLUE: '§1',
    DARK_AQUA: '§3',
    DARK_RED: '§4',
    BLACK: '§0',
    DARK_PURPLE: '§5',
    DARK_GREEN: '§2',
    GOLD: '§6',
    GRAY: '§7',
    DARK_GRAY: '§8',
    BLUE: '§9',
    GREEN: '§a',
    AQUA: '§b',
    RED: '§c',
    LIGHT_PURPLE: '§d',
    YELLOW: '§e',
    WHITE: '§f'
  };

function nameColor(player) {
    if (player.rank === 'YOUTUBER') {
        return `§c[§fYOUTUBE§c] ${player.displayname}`;
    }
    if (player.rank) {
      return `[${player.rank}] ${player.displayname}`;
    }
    if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') {
      let monthlyPlusColor = rankColor[player.rankPlusColor];
      if (!monthlyPlusColor) {
        monthlyPlusColor = '§c';
      }
      if (player.monthlyRankColor === 'GOLD') {
        return `§6[MVP${monthlyPlusColor}++§6] ${player.displayname}`;
      }
      if (player.monthlyRankColor === 'AQUA') {
        return `§b[MVP${monthlyPlusColor}++§b] ${player.displayname}`;
      }
    }
    if (player.newPackageRank === 'MVP_PLUS') {
      let monthlyPlusColor = rankColor[player.rankPlusColor];
      if (!monthlyPlusColor) {
        monthlyPlusColor = '§c';
      }
      return `§b[MVP${monthlyPlusColor}+§b] ${player.displayname}`;
    }
    if (player.newPackageRank === 'MVP') {
      return `§b[MVP] ${player.displayname}`;
    }
    if (player.newPackageRank === 'VIP_PLUS') {
      return `§a[VIP§6+§a] ${player.displayname}`;
    }
    if (player.newPackageRank === 'VIP') {
      return `§a[VIP] ${player.displayname}`;
    }
    return `§7${player.displayname}`;
  }

function bwColor(level) {
    if (level >= 2000) {
        const split = level.toString().split('');
        return `§8[§7${split[0]}§f${split[1]}§f${split[2]}§7${split[3]}✪§8]`;
    } else if (level >= 1900) {
        return `§7[§5${level}§8✪§7]`;
    } else if (level >= 1800) {
        return `§7[§9${level}§1✪§7]`;
    } else if (level >= 1700) {
        return `§7[§d${level}§5✪§7]`;
    } else if (level >= 1600) {
        return `§7[§c${level}§4✪§7]`;
    } else if (level >= 1500) {
        return `§7[§3${level}§9✪§7]`;
    } else if (level >= 1400) {
        return `§7[§a${level}§2✪§7]`;
    } else if (level >= 1300) {
        return `§7[§b${level}§3✪§7]`;
    } else if (level >= 1200) {
        return `§7[§e${level}§6✪§7]`;
    } else if (level >= 1100) {
        return `§7[§f${level}§7✪]`;
    } else if (level >= 1000) {
        const split = level.toString().split('');
        return `§c[§6${split[0]}§e${split[1]}§a${split[2]}§b${split[3]}§d✫§5]`;
    } else if (level >= 900) {
        return `§5[${level}✫]`;
    } else if (level >= 800) {
        return `§9[${level}✫]`;
    } else if (level >= 700) {
        return `§d[${level}✫]`;
    } else if (level >= 600) {
        return `§4[${level}✫]`;
    } else if (level >= 500) {
        return `§3[${level}✫]`;
    } else if (level >= 400) {
        return `§2[${level}✫]`;
    } else if (level >= 300) {
        return `§b[${level}✫]`;
    } else if (level >= 200) {
        return `§6[${level}✫]`;
    } else if (level >= 100) {
        return `§f[${level}✫]`;
    } else {
        return `§7[${level}✫]`;
    }
}

async function dmUser(discordClient, userid, message) {
    const user = await discordClient.users.fetch(userid);
    user.send(message);
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

module.exports = {
    hypixelRequest,
    nameToUUID,
    UUIDtoName,
    numberformatter,
    sleep,
    addCommas,
    addPoints,
    n,
    toFixed,
    paginator,
    hypixelLevel,
    nameColor,
    bwColor,
    dmUser,
    makeid,
    shuffleArray,
};