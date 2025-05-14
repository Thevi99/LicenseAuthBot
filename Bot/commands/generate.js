const { Client, Intents, MessageActionRow, MessageEmbed, MessageButton, Modal, TextInputComponent, MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const config = require('../config.json');
const fs = require('fs');

let games = config.games;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generate-key')
        .setDescription('Generate a key for a user')
        .addStringOption((option) => {
            option.setName('game').setDescription('game').setRequired(true);

            for (var x of games) {
                option.addChoices({
                    name: x.name,
                    value: x.value
                })
            }
            return option;
        })
        .addStringOption((option) => {
            option.setName('amount').setDescription('Enter the amount of keys').setRequired(true);
            return option;
        })
    ,
    async execute(interaction) {
        try {
            if (!interaction.member.roles.cache.has(config.adminroles)) return await interaction.followUp({ content: 'Your are not allowed to use this commands.', ephemeral: true });
            let game = interaction.options.getString('game')
            let amount = interaction.options.getString('amount');

            let headersList = {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }

            let bodyContent = JSON.stringify({
                "licenseCount": amount,
                "licenseName": game
            });

            let reqOptions = {
                url: config.api + "/license/generate?adminKey=" + config.apikey,
                method: "POST",
                headers: headersList,
                data: bodyContent,
            }

            let response = await axios.request(reqOptions);

            console.log(response.data);

            if (response.status != 201) {
                await interaction.followUp({ content: `Error: ${response.data}`, ephemeral: true });
                return;
            }

            let keys = response.data.licenseKeys;

            let keyList = [];

            for (var key of keys) {
                keyList.push(key);
            }

            console.log(keyList)
        
            const keysText = keyList.join('\n');
            const keysFile = new MessageAttachment(Buffer.from(keysText), 'keys.txt');

            return await interaction.followUp({ content: `Keys generated: ${keys.length}`, files: [keysFile] });

        } catch (error) {
            console.log(error);
            await interaction.followUp({ content: `Error: ${error}`, ephemeral: true });
        }
    },
};