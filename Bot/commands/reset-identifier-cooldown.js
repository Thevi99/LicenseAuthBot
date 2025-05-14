const { Client, Intents, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const config = require('../config.json');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-identifier-cooldown')
        .addMentionableOption((option) => {
            option.setName('user').setDescription('Select user').setRequired(true);
            return option;
        })
        .setDescription('Reset a user\'s identifier cooldown'),
    async execute(interaction) {
        try {
            if (!interaction.member.roles.cache.has(config.adminroles)) return await interaction.followUp({ content: 'Your are not allowed to use this commands.', ephemeral: true });
            const user = interaction.options.getMentionable('user');

            let headersList = {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }

            let bodyContent = JSON.stringify({
                "userId": user.id
            });

            let reqOptions = {
                url: config.api + "/users/resetcooldown?adminKey=" + config.apikey,
                method: "POST",
                headers: headersList,
                data: bodyContent,
            }

            let response = await axios.request(reqOptions);

            console.log(response.data);

            await interaction.followUp({ content: `${response.data.message}` });
        } catch (error) {
            console.log(error);
            let errorMessage = error.response.data.message;
            await interaction.followUp({ content: `${errorMessages}` });
        }
    },
};