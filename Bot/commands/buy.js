const { Client, Intents, MessageActionRow, MessageEmbed, MessageButton, Modal, TextInputComponent } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const config = require('../config.json');

let games = config.games;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('buy script using voucher code.')
        .addStringOption((option) => {
            option.setName('vouchercode').setDescription('Enter Voucher URI Here.').setRequired(true);
            return option;
        })
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

    ,
    async execute(interaction) {
        try {
            const gameName = interaction.options.getString('game');
            const voucherCode = interaction.options.getString('vouchercode');
            const userId = interaction.user.id

            let headersList = {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }

            let bodyContent = JSON.stringify({
                "licenseName": gameName,
                "VoucherCode": voucherCode
            });

            let reqOptions = {
                url: config.api + "/license/voucher",
                method: "POST",
                headers: headersList,
                data: bodyContent,
            }

            let response = await axios.request(reqOptions);

            if (response.status != 201) {
                await interaction.followUp({ content: `Error: ${response.data.errorMessage}`, ephemeral: true });
                return;
            }

            const ScriptEmbed = new MessageEmbed()
                .setColor('#00fffb')
                .setImage('https://i.pinimg.com/originals/ec/e2/20/ece220bf046ef858e05c4c2e504fd262.gif')
                .addFields({
                    name: 'Zeta Hub License Key',
                    value: "```" + response.data.licenseKey + "```",
                    inline: true
                })
                .setFooter({ text: 'Powered by Nexus Client & Zeta Hub' })
                .setTimestamp();

            await interaction.followUp({ embeds: [ScriptEmbed] });
        } catch (error) {
            console.log(error);
            await interaction.followUp({ content: `Error: ${error.response.data.errorMessage}`, ephemeral: true });
        }


    },
};