const { Client, Intents, MessageActionRow, MessageEmbed, MessageButton, Modal, TextInputComponent } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const config = require('../config.json');

let games = config.games;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('script')
        .setDescription('Get the script for the game')
    ,
    async execute(interaction) {
        try {
            if (!interaction.member.roles.cache.has(config['buyers-roles'])) return await interaction.followUp({ content: 'Your are not allowed to use this commands.', ephemeral: true });
            const userid = interaction.user.id;

            let headersList = {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }

            let bodyContent = JSON.stringify({
                "userId": userid
            });

            let reqOptions = {
                url: config.api + "/users/getscript?adminKey=" + config.apikey,
                method: "POST",
                headers: headersList,
                data: bodyContent,
            }

            let response = await axios.request(reqOptions);
            console.log(response.data);

            let license = response.data.encryptedData + ':' + response.data.tag

            const ScriptEmbed = new MessageEmbed()
                .setColor('#00fffb')
                .setImage('https://i.pinimg.com/originals/ec/e2/20/ece220bf046ef858e05c4c2e504fd262.gif')
                .addFields({
                    name: 'Zeta Hub Script',
                    value: "```lua\n_G.Keys = '" + license + "'\nloadstring(game:HttpGet('https://raw.githubusercontent.com/rayrei0112/zetahub_loard/main/zetahub.lua'))();```",
                    inline: true
                })
                .setFooter({ text: 'Powered by Nexus Client & Zeta Hub' })
                .setTimestamp();
            await interaction.followUp({ embeds: [ScriptEmbed], ephemeral: true });
        } catch (error) {
            console.log(error);
            await interaction.followUp({ content: `Error: ${error.response.data.message}`, ephemeral: true });
        }


    },
};