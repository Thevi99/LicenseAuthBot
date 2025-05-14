const { Client, Intents, MessageActionRow, MessageEmbed, MessageButton, Modal, TextInputComponent } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .addStringOption((option) => {
            option.setName('serial-key').setDescription('Enter Serial-Key Here.').setRequired(true);
            return option;
        })
        .setDescription('Redeem a serial key'),
    async execute(interaction) {
        try {
            const serialKey = interaction.options.getString('serial-key');
            const userId = interaction.user.id

            let headersList = {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }

            let bodyContent = JSON.stringify({
                "licenseKey": serialKey,
                "userid": userId
            });

            let reqOptions = {
                url: config.api + "/license/activate?adminKey=" + config.apikey,
                method: "POST",
                headers: headersList,
                data: bodyContent,
            }

            let response = await axios.request(reqOptions);

            // give role

            if (!interaction.member.roles.cache.has(config['buyers-roles'])) {
                await interaction.member.roles.add(config['buyers-roles']);
            }

            await interaction.followUp({ content: `Message: ${response.data.message}`, ephemeral: true });
        } catch (error) {
            let errorResponse = error.response.data || error;
            await interaction.followUp({ content: `Error: ${errorResponse.message}`, ephemeral: true });
        }
    },
};
