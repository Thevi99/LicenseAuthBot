const { Client, Intents, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-identifier')
        .setDescription('Reset a user\'s identifier'),
    async execute(interaction) {
        try {
            if (!interaction.member.roles.cache.has(config['buyers-roles'])) return await interaction.followUp({ content: 'Your are not allowed to use this commands.', ephemeral: true });
            const DiscordId = interaction.user.id;

            let headersList = {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }

            let bodyContent = JSON.stringify({
                "userId": DiscordId
            });

            let reqOptions = {
                url: config.api + "/users/resethwid?adminKey=" + config.apikey,
                method: "POST",
                headers: headersList,
                data: bodyContent,
            }

            let response = await axios.request(reqOptions);

            await interaction.followUp({ content: `${response.data.message}` });
        } catch (error) {
            console.log(error);
            let errorMessages = error.response.data.message;
            await interaction.followUp({ content: `${errorMessages}` });
        }
    },
};