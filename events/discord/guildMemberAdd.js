const config = require('../../config.json');

module.exports = {
    execute: async (discordClient, member) => {
            member.roles.add(config.roles.unverified);
    }
};