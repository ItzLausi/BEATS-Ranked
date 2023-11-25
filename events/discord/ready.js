const config = require('../../config.json');
const fs = require('fs');
const leaderboards = require('../../helper/leaderboards.js');

async function execute(discordClient) {
    console.log('[DISCORD] Logged in!');
    
    discordClient.user.setActivity('BEAT Ranked', { type: 'PLAYING' });
    discordClient.user.setStatus('online');

    leaderboards(discordClient);

    const guild = discordClient.guilds.cache.get(config.discordServer);
    if (guild) {
        const refreshedConfig = JSON.parse(fs.readFileSync('./config.json').toString());
        if (!refreshedConfig.slashCommandsSet) {
            const slashCommands = [];
            for (const command of discordClient.commands) {
                slashCommands.push({
                    name: command[1].name,
                    description: command[1].description,
                    options: command[1].options || [],
                });
            }
            await guild.commands.set(slashCommands);

            refreshedConfig.slashCommandsSet = true;
            fs.writeFileSync('./config.json', JSON.stringify(refreshedConfig, null, 2));
        }
    }
    module.exports = {
        execute,
    };
}

module.exports = {
    execute,
};