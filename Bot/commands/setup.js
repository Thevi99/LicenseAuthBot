const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ms = require('ms');
const License = require('../models/License');
const User = require('../models/Auth');
const config = require('../config.json');
const axios = require('axios');
const FormData = require('form-data');

// สถานะของ Nodes
const nodeStatus = {
    'ZETA HUB NODE 1': '🟢',
    'ZETA HUB NODE 2': '🟢',
    'ZETA HUB NODE 3': '🟢',
    'ZETA HUB NODE 4': '🟢',
};

// ตัวแปรชั่วคราวสำหรับเก็บข้อมูลเกมที่เลือก
const userGameSelections = new Map();

// ฟังก์ชันสำหรับสร้างสตริงแบบสุ่ม
const randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

// ฟังก์ชันสำหรับเรียก API True Wallet
async function topUpWithTrueWallet(voucherLink, licenseName) {
    try {
      const response = await axios.post('http://localhost:3000/license/voucher', {
        licenseName: licenseName,
        VoucherCode: voucherLink
      });
  
      if (response.status === 201) {
        return {
          success: true,
          licenseKey: response.data.licenseKey,
          amount: 90
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Unknown error'
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Unknown error occurred'
      };
    }
  }
  

// ฟังก์ชันสำหรับ Generate Script และ License Key
async function generateScript(userId, gameName) {
    try {
        // สร้าง License Key ในรูปแบบ licenseName + '_' + randomString(25)
        const licenseKey = `${gameName}_${randomString(25)}`;
        
        // สร้างเนื้อหาของสคริปต์ (ตัวอย่าง)
        const scriptContent = `-- ZetaHub Script for ${gameName}\n` +
                            `local LicenseKey = "${licenseKey}"\n` +
                            `local UserID = "${userId}"\n` +
                            `local Game = "${gameName}"\n` +
                            `-- Add your script logic here\n` +
                            `print("Hello from ZetaHub! This script is for ${gameName}")\n` +
                            `return { key = LicenseKey, user = UserID, game = Game }`;

        // บันทึก License Key และสคริปต์ลงใน MongoDB
        const newLicense = new License({
            License: licenseKey,
            Script_Name: gameName,
            Owner: userId,
            Status: 1, // 1 = ใช้งานแล้ว
            Script_Content: scriptContent // เก็บเนื้อหาสคริปต์
        });
        await newLicense.save();

        console.log(`[INFO] Generated License Key for user ${userId}, game: ${gameName}, licenseKey: ${licenseKey}`);
        return {
            licenseKey: licenseKey,
            scriptContent: scriptContent
        };
    } catch (error) {
        console.error(`[ERROR] Failed to generate License Key for user ${userId}:`, error);
        throw new Error("Failed to generate License Key");
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set up ZetaHub Pro panel'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('ZETAHUB.PRO - EXCLUSIVE LUA SCRIPTS')
            .setDescription(`**STATUS:**\n` +
                `- [ZETA HUB NODE 1]: ${nodeStatus['ZETA HUB NODE 1']}\n` +
                `- [ZETA HUB NODE 2]: ${nodeStatus['ZETA HUB NODE 2']}\n` +
                `- [ZETA HUB NODE 3]: ${nodeStatus['ZETA HUB NODE 3']}\n` +
                `- [ZETA HUB NODE 4]: ${nodeStatus['ZETA HUB NODE 4']}`)
            .setImage('https://images-ext-1.discordapp.net/external/Gpm5eU1yoZ7HzUtCq5JqmXwpRjc6hRWAXW3sD4kqiRo/https/m1r.ai/sqW9.png?format=webp&quality=lossless&width=1872&height=623')
            .setFooter({ text: 'by @TheVi' })
            .setColor('#00BFFF');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('redeem_license')
                    .setLabel('Redeem License')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('get_script')
                    .setLabel('Get Script')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('buy_script')
                    .setLabel('Buy Script')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('reset_identifier')
                    .setLabel('Reset Identifier')
                    .setStyle(ButtonStyle.Danger),
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_monthly')
                    .setLabel('Claim Monthly')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('leaderboard')
                    .setLabel('Leaderboard')
                    .setStyle(ButtonStyle.Secondary),
            );

        await interaction.editReply({ embeds: [embed], components: [row, row2], ephemeral: true });
    },
    handleInteraction: async (interaction, client) => {
        console.log(`[INFO] Interaction received: ${interaction.type}, Custom ID: ${interaction.customId}`);

        if (interaction.isButton()) {
            const clientId = interaction.user.id;

            // ฟีเจอร์ Redeem License
            if (interaction.customId === 'redeem_license') {
                // สร้าง Modal
                const modal = new ModalBuilder()
                    .setCustomId(`redeem_form_${clientId}`)
                    .setTitle('Redeem License Key');
            
                // สร้างช่องกรอก License Key
                const licenseInput = new TextInputBuilder()
                    .setCustomId('license_key')
                    .setLabel('License Key')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('กรุณากรอก License Key ของคุณ')
                    .setRequired(true);
            
                const firstRow = new ActionRowBuilder().addComponents(licenseInput);
                modal.addComponents(firstRow);
            
                // แสดง Modal
                await interaction.showModal(modal);
            }

            // ฟีเจอร์ Buy Script
            else if (interaction.customId === 'buy_script') {
                let user = await User.findOne({ Client_ID: clientId });
                if (!user) {
                    user = new User({ Client_ID: clientId });
                    await user.save();
                }

                if (user.Blacklisted) {
                    await interaction.reply({ content: 'คุณถูกแบนและไม่สามารถซื้อสคริปต์ได้!', ephemeral: true });
                    return;
                }

                const games = config.games;
                if (!games || games.length === 0) {
                    await interaction.reply({ content: 'ไม่มีเกมให้เลือก! กรุณาติดต่อแอดมิน', ephemeral: true });
                    return;
                }

                if (games.length > 25) {
                    await interaction.reply({ content: 'มีเกมมากเกินไป! กรุณาติดต่อแอดมินเพื่อลดจำนวนเกมใน Dropdown', ephemeral: true });
                    return;
                }

                const gameSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`select_game_${clientId}`)
                    .setPlaceholder('เลือกเกมที่ต้องการซื้อ')
                    .addOptions(
                        games.map((game, index) => ({
                            label: `${game.name} - ${game.price} Points`,
                            description: game.description,
                            value: index.toString(),
                        }))
                    );

                const row1 = new ActionRowBuilder().addComponents(gameSelectMenu);

                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`cancel_${clientId}`)
                            .setLabel('ยกเลิก')
                            .setStyle(ButtonStyle.Danger)
                    );

                const gameListEmbed = new EmbedBuilder()
                    .setTitle('📝 กรอกข้อมูลการซื้อสคริปต์')
                    .setDescription(
                        `**ขั้นตอนที่ 1: เลือกเกม**\n` +
                        `กรุณาเลือกเกมจากเมนูด้านล่าง\n\n` +
                        `**ขั้นตอนที่ 2: กรอกข้อมูล**\n` +
                        `หลังจากเลือกเกมแล้ว คุณจะต้องกรอกข้อมูลในฟอร์ม:\n` +
                        `- ลิงค์ อังเปา True Wallet (เช่น https://gift.truemoney.com/...)`
                    )
                    .setColor('#FFAA00');

                await interaction.reply({ embeds: [gameListEmbed], components: [row1, row2], ephemeral: true });
            }

            // ปุ่ม "ยกเลิก"
            else if (interaction.customId.startsWith('cancel_')) {
                const clientId = interaction.user.id;
                userGameSelections.delete(clientId);

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('📝 ยกเลิกการซื้อสคริปต์')
                            .setDescription('คุณได้ยกเลิกการซื้อสคริปต์เรียบร้อยแล้ว')
                            .setColor('#FF0000')
                    ],
                    components: [],
                    ephemeral: true
                });
            }

            // ฟีเจอร์ Get Script
            else if (interaction.customId === 'get_script') {
                const clientId = interaction.user.id;

                try {
                    const response = await axios.post(`${config.api}/users/getscript?adminKey=${config.apikey}`, {
                        userId: clientId
                    });
            
                    const license = `${response.data.encryptedData}:${response.data.tag}`;
            
                    const ScriptEmbed = new EmbedBuilder()
                        .setColor('#00fffb')
                        .setImage('https://i.pinimg.com/originals/ec/e2/20/ece220bf046ef858e05c4c2e504fd262.gif')
                        .addFields({
                            name: 'Zeta Hub Script',
                            value: `\`\`\`lua\n_G.Keys = '${license}'\nloadstring(game:HttpGet('https://raw.githubusercontent.com/rayrei0112/zetahub_loard/main/zetahub.lua'))();\n\`\`\``,
                            inline: true
                        })
                        .setFooter({ text: 'Powered by Nexus Client & Zeta Hub' })
                        .setTimestamp();
            
                    await interaction.reply({ embeds: [ScriptEmbed], ephemeral: true });
                } catch (error) {
                    console.error('[Get Script Error]', error);
                    await interaction.reply({
                        content: `❌ ไม่สามารถดึงสคริปต์ได้: ${error.response?.data?.message || error.message}`,
                        ephemeral: true
                    });
                }
            }

            // ฟีเจอร์ Reset Identifier
            else if (interaction.customId === 'reset_identifier') {
                const clientId = interaction.user.id;
                
                try {
                    // ตรวจสอบว่ามี role buyer หรือไม่
                    const member = interaction.guild.members.cache.get(clientId);
                    if (!member.roles.cache.has(config['buyers-roles'])) {
                        await interaction.reply({ 
                            content: 'You are not allowed to use this command.', 
                            ephemeral: true 
                        });
                        return;
                    }
            
                    // เตรียม header และ body สำหรับ API
                    let headersList = {
                        "Accept": "*/*",
                        "Content-Type": "application/json"
                    };
            
                    let bodyContent = JSON.stringify({
                        "userId": clientId
                    });
            
                    let reqOptions = {
                        url: config.api + "/users/resethwid?adminKey=" + config.apikey,
                        method: "POST",
                        headers: headersList,
                        data: bodyContent,
                    };
            
                    // เรียก API
                    let response = await axios.request(reqOptions);
            
                    // อัพเดทใน database
                    let user = await User.findOne({ Client_ID: clientId });
                    if (!user) {
                        user = new User({
                            Client_ID: clientId,
                            Identifier: 'IDENTIFIER-' + Math.random().toString(36).substring(2, 15),
                        });
                        await user.save();
                        await interaction.reply({ 
                            content: `Identifier ถูกสร้างใหม่: ${user.Identifier}\nAPI Response: ${response.data.message}`, 
                            ephemeral: true 
                        });
                    } else {
                        const oldIdentifier = user.Identifier;
                        user.Last_Identifier = oldIdentifier;
                        user.Identifier = 'IDENTIFIER-' + Math.random().toString(36).substring(2, 15);
                        await user.save();
                        await interaction.reply({ 
                            content: `Identifier รีเซ็ตแล้ว!\nเก่า: ${oldIdentifier} -> ใหม่: ${user.Identifier}\nAPI Response: ${response.data.message}`, 
                            ephemeral: true 
                        });
                    }
                } catch (error) {
                    console.log(error);
                    let errorMessages = error.response?.data?.message || error.message;
                    await interaction.reply({ 
                        content: `เกิดข้อผิดพลาด: ${errorMessages}`, 
                        ephemeral: true 
                    });
                }
            }

            // ฟีเจอร์ Claim Monthly
            else if (interaction.customId === 'claim_monthly') {
                const now = Date.now();
                const cooldown = ms('30d');

                let user = await User.findOne({ Client_ID: clientId });
                if (!user) {
                    user = new User({ Client_ID: clientId });
                }

                if (user.Blacklisted) {
                    await interaction.reply({ content: 'คุณถูกแบนและไม่สามารถรับรางวัลได้!', ephemeral: true });
                    return;
                }

                const lastClaim = user.Cooldown || 0;
                if (now - lastClaim < cooldown) {
                    const timeLeft = ms(cooldown - (now - lastClaim), { long: true });
                    await interaction.reply({ content: `คุณสามารถรับรางวัลได้อีกครั้งใน ${timeLeft}!`, ephemeral: true });
                } else {
                    user.Cooldown = now;
                    user.Points += 20;
                    await user.save();
                    await interaction.reply({ content: `รับรางวัลรายเดือนสำเร็จ! คุณได้รับ 20 Points! ตอนนี้คุณมี ${user.Points} Points.`, ephemeral: true });
                }
            }

            // ฟีเจอร์ Leaderboard
            else if (interaction.customId === 'leaderboard') {
                const leaderboard = await User.find()
                    .sort({ Licenses: -1 })
                    .limit(5);

                if (leaderboard.length === 0) {
                    await interaction.reply({ content: 'Leaderboard ว่างเปล่า!', ephemeral: true });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle('🏆 Leaderboard')
                    .setDescription(
                        leaderboard
                            .map((user, index) => `${index + 1}. <@${user.Client_ID}> - ${user.Licenses.length} Licenses\n` +
                                `Scripts: ${user.Assets.join(', ') || 'None'}\nPoints: ${user.Points}`)
                            .join('\n\n')
                    )
                    .setColor('#FFD700');

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // จัดการ Select Menu (เลือกเกม)
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('select_game_')) {
                try {
                    console.log(`[INTERACTION] select_game_${interaction.user.id} started`);

                    const clientId = interaction.user.id;
                    const gameIndex = parseInt(interaction.values[0]);
                    const games = config.games;

                    if (gameIndex < 0 || gameIndex >= games.length) {
                        console.log(`[ERROR] Invalid gameIndex: ${gameIndex}, games length: ${games.length}`);
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('📝 เกิดข้อผิดพลาด')
                                    .setDescription('ไม่พบเกมที่เลือก! กรุณาลองใหม่อีกครั้ง')
                                    .setColor('#FF0000')
                            ],
                            ephemeral: true
                        });
                        return;
                    }

                    const selectedGame = games[gameIndex];
                    console.log(`[INFO] User ${clientId} selected game: ${selectedGame.name}`);

                    userGameSelections.set(clientId, selectedGame);

                    const modal = new ModalBuilder()
                        .setCustomId(`purchase_form_${clientId}`)
                        .setTitle('กรอกข้อมูลการซื้อสคริปต์');

                    const walletLinkInput = new TextInputBuilder()
                        .setCustomId('wallet_link')
                        .setLabel('ลิงค์ อังเปา True Wallet')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('เช่น https://gift.truemoney.com/...')
                        .setRequired(true);

                    const firstRow = new ActionRowBuilder().addComponents(walletLinkInput);
                    modal.addComponents(firstRow);

                    console.log(`[INFO] Showing modal for user ${clientId}`);
                    await interaction.showModal(modal);
                } catch (error) {
                    console.error('Error in select_game interaction:', error);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('📝 เกิดข้อผิดพลาด')
                                .setDescription('เกิดข้อผิดพลาดขณะเลือกเกม! กรุณาลองใหม่อีกครั้ง')
                                .setColor('#FF0000')
                        ],
                        ephemeral: true
                    });
                }
            }
        }

        // จัดการ Modal Submission (เมื่อผู้ใช้กด Submit ใน Modal)
        if (interaction.isModalSubmit()) {
            console.log(`[INFO] Modal submit interaction received: ${interaction.customId}`);
            if (interaction.customId.startsWith('purchase_form_')) {
                const clientId = interaction.user.id;
                console.log(`[INFO] Modal submitted by user ${clientId}`);
        
                try {
                    const walletLink = interaction.fields.getTextInputValue('wallet_link');
                    console.log(`[INFO] Wallet link: ${walletLink}`);
        
                    if (!walletLink.startsWith('http') || !walletLink.includes('gift.truemoney.com') || !walletLink.includes('v=')) {
                        console.log('[ERROR] Wallet link validation failed');
                        await interaction.reply({ content: 'กรุณาใส่ลิงค์ True Wallet ที่ถูกต้อง (เช่น https://gift.truemoney.com/campaign/?v=...)!', ephemeral: true });
                        return;
                    }
        
                    const selectedGame = userGameSelections.get(clientId);
                    if (!selectedGame) {
                        console.log('[ERROR] Selected game not found');
                        await interaction.reply({ content: 'ไม่พบข้อมูลเกมที่เลือก! กรุณาเริ่มต้นใหม่', ephemeral: true });
                        return;
                    }
        
                    // เรียก API ฝั่ง Server
                    const response = await axios.post('http://localhost:3000/license/voucher', {
                        licenseName: selectedGame.name,
                        VoucherCode: walletLink
                    });
        
                    if (response.status !== 201) {
                        await interaction.reply({ content: `❌ ไม่สามารถซื้อสคริปต์ได้: ${response.data.message || 'Unknown error'}`, ephemeral: true });
                        return;
                    }
        
                    const licenseKey = response.data.licenseKey;
                    const amount = response.data.amount || 90; // fallback
        
                    // อัปเดตผู้ใช้: หักแต้มและเพิ่ม License (เหมือนเดิม)
                    let user = await User.findOne({ Client_ID: clientId });
                    const gamePrice = selectedGame.price;
        
                    if (!user) {
                        user = new User({ Client_ID: clientId, Points: 0 });
                    }
        
                    if (user.Points < gamePrice) {
                        await interaction.reply({
                            content: `❌ คุณมี Points ไม่เพียงพอ! ต้องการ ${gamePrice} Points แต่คุณมี ${user.Points} Points`,
                            ephemeral: true
                        });
                        return;
                    }
        
                    if (user.Assets.includes(selectedGame.value)) {
                        await interaction.reply({ content: `❌ คุณมีสคริปต์ ${selectedGame.name} อยู่แล้ว!`, ephemeral: true });
                        return;
                    }
        
                    user.Points -= gamePrice;
                    user.Assets.push(selectedGame.value);
                    user.Licenses.push(licenseKey);
                    await user.save();
        
                    // เพิ่ม Role ให้ผู้ใช้
                    try {
                        const member = interaction.guild.members.cache.get(clientId);
                        const buyerRoleId = config['buyers-roles'];
                        await member.roles.add(buyerRoleId);
                        console.log(`Added Buyer role (${buyerRoleId}) to user ${clientId}`);
                    } catch (error) {
                        console.error(`Failed to add Buyer role to user ${clientId}:`, error);
                    }
        
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('📝 ซื้อสคริปต์สำเร็จ')
                                .setDescription(
                                    `คุณได้รับ ${selectedGame.name} และ Role Buyer\n` +
                                    `คุณใช้ ${gamePrice} Points (เหลือ ${user.Points} Points)\n` +
                                    `เติมเงินผ่าน True Wallet: ${amount} บาท\n\n` +
                                    `**License Key:** \`${licenseKey}\`\n` +
                                    `กรุณานำ License Key ไป Redeem เพื่อใช้งาน`
                                )
                                .setColor('#00FF00')
                        ],
                        ephemeral: true
                    });
        
                    userGameSelections.delete(clientId);
                } catch (error) {
                    console.error('Error in purchase_form submission:', error);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('📝 เกิดข้อผิดพลาด')
                                .setDescription(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`)
                                .setColor('#FF0000')
                        ],
                        ephemeral: true
                    });
                    userGameSelections.delete(clientId);
                }
            } else if (interaction.customId.startsWith('redeem_form_')) {
                const clientId = interaction.user.id;
                
                try {
                    const licenseKey = interaction.fields.getTextInputValue('license_key');
                    
                    const response = await axios.post('http://localhost:3000/license/activate', {
                        licenseKey,
                        userid: clientId
                    });

                    if (response.status === 201 || response.status === 200) {
                        await interaction.reply({ 
                            content: `✅ License redeemed! คุณได้รับ script: ${response.data.licenseName || 'ไม่ทราบชื่อ'}`,
                            ephemeral: true 
                        });
                    } else {
                        await interaction.reply({ 
                            content: `❌ Redeem ล้มเหลว: ${response.data.message}`,
                            ephemeral: true 
                        });
                    }
                } catch (err) {
                    await interaction.reply({ 
                        content: `❌ Redeem ผิดพลาด: ${err.response?.data?.message || err.message}`,
                        ephemeral: true 
                    });
                }
            } else {
                console.log(`[INFO] Modal submit ignored, customId does not match: ${interaction.customId}`);
            }
        }        
    },
};




// const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
// const ms = require('ms');
// const License = require('../models/License');
// const User = require('../models/Auth');
// const config = require('../config.json');
// const axios = require('axios');
// const FormData = require('form-data');

// // สถานะของ Nodes
// const nodeStatus = {
//     'ZETA HUB NODE 1': '🟢',
//     'ZETA HUB NODE 2': '🟢',
//     'ZETA HUB NODE 3': '🟢',
//     'ZETA HUB NODE 4': '🟢',
// };

// // ตัวแปรชั่วคราวสำหรับเก็บข้อมูลเกมที่เลือก
// const userGameSelections = new Map();

// // ฟังก์ชันสำหรับสร้างสตริงแบบสุ่ม
// const randomString = function(length) {
//     var text = "";
//     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//     for (var i = 0; i < length; i++)
//         text += possible.charAt(Math.floor(Math.random() * possible.length));

//     return text;
// };

// // ฟังก์ชันสำหรับเรียก API True Wallet
// async function topUpWithTrueWallet(voucherLink, licenseName) {
//     try {
//       const response = await axios.post('http://localhost:3000/license/voucher', {
//         licenseName: licenseName,
//         VoucherCode: voucherLink
//       });
  
//       if (response.status === 201) {
//         return {
//           success: true,
//           licenseKey: response.data.licenseKey,
//           amount: 90
//         };
//       } else {
//         return {
//           success: false,
//           message: response.data.message || 'Unknown error'
//         };
//       }
//     } catch (err) {
//       return {
//         success: false,
//         message: err.response?.data?.message || err.message || 'Unknown error occurred'
//       };
//     }
//   }
  

// // ฟังก์ชันสำหรับ Generate Script และ License Key
// async function generateScript(userId, gameName) {
//     try {
//         // สร้าง License Key ในรูปแบบ licenseName + '_' + randomString(25)
//         const licenseKey = `${gameName}_${randomString(25)}`;
        
//         // สร้างเนื้อหาของสคริปต์ (ตัวอย่าง)
//         const scriptContent = `-- ZetaHub Script for ${gameName}\n` +
//                             `local LicenseKey = "${licenseKey}"\n` +
//                             `local UserID = "${userId}"\n` +
//                             `local Game = "${gameName}"\n` +
//                             `-- Add your script logic here\n` +
//                             `print("Hello from ZetaHub! This script is for ${gameName}")\n` +
//                             `return { key = LicenseKey, user = UserID, game = Game }`;

//         // บันทึก License Key และสคริปต์ลงใน MongoDB
//         const newLicense = new License({
//             License: licenseKey,
//             Script_Name: gameName,
//             Owner: userId,
//             Status: 1, // 1 = ใช้งานแล้ว
//             Script_Content: scriptContent // เก็บเนื้อหาสคริปต์
//         });
//         await newLicense.save();

//         console.log(`[INFO] Generated License Key for user ${userId}, game: ${gameName}, licenseKey: ${licenseKey}`);
//         return {
//             licenseKey: licenseKey,
//             scriptContent: scriptContent
//         };
//     } catch (error) {
//         console.error(`[ERROR] Failed to generate License Key for user ${userId}:`, error);
//         throw new Error("Failed to generate License Key");
//     }
// }

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('setup')
//         .setDescription('Set up ZetaHub Pro panel'),
//     async execute(interaction) {
//         const embed = new EmbedBuilder()
//             .setTitle('ZETAHUB.PRO - EXCLUSIVE LUA SCRIPTS')
//             .setDescription(`**STATUS:**\n` +
//                 `- [ZETA HUB NODE 1]: ${nodeStatus['ZETA HUB NODE 1']}\n` +
//                 `- [ZETA HUB NODE 2]: ${nodeStatus['ZETA HUB NODE 2']}\n` +
//                 `- [ZETA HUB NODE 3]: ${nodeStatus['ZETA HUB NODE 3']}\n` +
//                 `- [ZETA HUB NODE 4]: ${nodeStatus['ZETA HUB NODE 4']}`)
//             .setImage('https://images-ext-1.discordapp.net/external/Gpm5eU1yoZ7HzUtCq5JqmXwpRjc6hRWAXW3sD4kqiRo/https/m1r.ai/sqW9.png?format=webp&quality=lossless&width=1872&height=623')
//             .setFooter({ text: 'by @TheVi' })
//             .setColor('#00BFFF');

//         const row = new ActionRowBuilder()
//             .addComponents(
//                 new ButtonBuilder()
//                     .setCustomId('redeem_license')
//                     .setLabel('Redeem License')
//                     .setStyle(ButtonStyle.Success),
//                 new ButtonBuilder()
//                     .setCustomId('get_script')
//                     .setLabel('Get Script')
//                     .setStyle(ButtonStyle.Primary),
//                 new ButtonBuilder()
//                     .setCustomId('buy_script')
//                     .setLabel('Buy Script')
//                     .setStyle(ButtonStyle.Primary),
//                 new ButtonBuilder()
//                     .setCustomId('reset_identifier')
//                     .setLabel('Reset Identifier')
//                     .setStyle(ButtonStyle.Danger),
//             );

//         const row2 = new ActionRowBuilder()
//             .addComponents(
//                 new ButtonBuilder()
//                     .setCustomId('claim_monthly')
//                     .setLabel('Claim Monthly')
//                     .setStyle(ButtonStyle.Secondary),
//                 new ButtonBuilder()
//                     .setCustomId('leaderboard')
//                     .setLabel('Leaderboard')
//                     .setStyle(ButtonStyle.Secondary),
//             );

//         await interaction.editReply({ embeds: [embed], components: [row, row2], ephemeral: true });
//     },
//     handleInteraction: async (interaction, client) => {
//         console.log(`[INFO] Interaction received: ${interaction.type}, Custom ID: ${interaction.customId}`);

//         if (interaction.isButton()) {
//             const clientId = interaction.user.id;

//             // ฟีเจอร์ Redeem License
//             if (interaction.customId === 'redeem_license') {
//                 await interaction.reply({ content: 'Please enter your License Key to redeem!', ephemeral: true });

//                 const filter = (m) => m.author.id === interaction.user.id;
//                 const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

//                 collector.on('collect', async (m) => {
//                     const licenseKey = m.content;
//                     try {
//                     const response = await axios.post('http://localhost:3000/license/activate', {
//                         licenseKey,
//                         userid: clientId
//                     });

//                     if (response.status === 201 || response.status === 200) {
//                         await m.reply(`✅ License redeemed! คุณได้รับ script: ${response.data.licenseName || 'ไม่ทราบชื่อ'}`);
//                     } else {
//                         await m.reply(`❌ Redeem ล้มเหลว: ${response.data.message}`);
//                     }
//                     } catch (err) {
//                     await m.reply(`❌ Redeem ผิดพลาด: ${err.response?.data?.message || err.message}`);
//                     }
//                     collector.stop();
//                 });

//                 collector.on('end', (collected, reason) => {
//                     if (reason === 'time') {
//                         interaction.followUp({ content: 'Time’s up! Please try again.', ephemeral: true });
//                     }
//                 });
//             }

//             // ฟีเจอร์ Buy Script
//             else if (interaction.customId === 'buy_script') {
//                 let user = await User.findOne({ Client_ID: clientId });
//                 if (!user) {
//                     user = new User({ Client_ID: clientId });
//                     await user.save();
//                 }

//                 if (user.Blacklisted) {
//                     await interaction.reply({ content: 'คุณถูกแบนและไม่สามารถซื้อสคริปต์ได้!', ephemeral: true });
//                     return;
//                 }

//                 const games = config.games;
//                 if (!games || games.length === 0) {
//                     await interaction.reply({ content: 'ไม่มีเกมให้เลือก! กรุณาติดต่อแอดมิน', ephemeral: true });
//                     return;
//                 }

//                 if (games.length > 25) {
//                     await interaction.reply({ content: 'มีเกมมากเกินไป! กรุณาติดต่อแอดมินเพื่อลดจำนวนเกมใน Dropdown', ephemeral: true });
//                     return;
//                 }

//                 const gameSelectMenu = new StringSelectMenuBuilder()
//                     .setCustomId(`select_game_${clientId}`)
//                     .setPlaceholder('เลือกเกมที่ต้องการซื้อ')
//                     .addOptions(
//                         games.map((game, index) => ({
//                             label: `${game.name} - ${game.price} Points`,
//                             description: game.description,
//                             value: index.toString(),
//                         }))
//                     );

//                 const row1 = new ActionRowBuilder().addComponents(gameSelectMenu);

//                 const row2 = new ActionRowBuilder()
//                     .addComponents(
//                         new ButtonBuilder()
//                             .setCustomId(`cancel_${clientId}`)
//                             .setLabel('ยกเลิก')
//                             .setStyle(ButtonStyle.Danger)
//                     );

//                 const gameListEmbed = new EmbedBuilder()
//                     .setTitle('📝 กรอกข้อมูลการซื้อสคริปต์')
//                     .setDescription(
//                         `**ขั้นตอนที่ 1: เลือกเกม**\n` +
//                         `กรุณาเลือกเกมจากเมนูด้านล่าง\n\n` +
//                         `**ขั้นตอนที่ 2: กรอกข้อมูล**\n` +
//                         `หลังจากเลือกเกมแล้ว คุณจะต้องกรอกข้อมูลในฟอร์ม:\n` +
//                         `- ลิงค์ อังเปา True Wallet (เช่น https://gift.truemoney.com/...)`
//                     )
//                     .setColor('#FFAA00');

//                 await interaction.reply({ embeds: [gameListEmbed], components: [row1, row2], ephemeral: true });
//             }

//             // ปุ่ม "ยกเลิก"
//             else if (interaction.customId.startsWith('cancel_')) {
//                 const clientId = interaction.user.id;
//                 userGameSelections.delete(clientId);

//                 await interaction.update({
//                     embeds: [
//                         new EmbedBuilder()
//                             .setTitle('📝 ยกเลิกการซื้อสคริปต์')
//                             .setDescription('คุณได้ยกเลิกการซื้อสคริปต์เรียบร้อยแล้ว')
//                             .setColor('#FF0000')
//                     ],
//                     components: [],
//                     ephemeral: true
//                 });
//             }

//             // ฟีเจอร์ Get Script
//             else if (interaction.customId === 'get_script') {
//                 const user = await User.findOne({ Client_ID: clientId });
//                 if (!user || user.Licenses.length === 0) {
//                     await interaction.reply({ content: 'คุณต้อง Redeem License Key ก่อนถึงจะรับสคริปต์ได้!', ephemeral: true });
//                     return;
//                 }

//                 // ดึงสคริปต์จาก MongoDB
//                 const licenses = await License.find({ Owner: clientId, Status: 1 });
//                 if (!licenses || licenses.length === 0) {
//                     await interaction.reply({ content: 'ไม่พบสคริปต์ที่คุณเป็นเจ้าของ!', ephemeral: true });
//                     return;
//                 }

//                 const scriptList = licenses.map(license => `**${license.Script_Name}** (Key: ${license.License})\n\`\`\`lua\n${license.Script_Content || 'No script content available'}\n\`\`\``).join('\n\n');
//                 await interaction.reply({ content: `นี่คือสคริปต์ของคุณ:\n${scriptList}`, ephemeral: true });
//             }

//             // ฟีเจอร์ Reset Identifier
//             else if (interaction.customId === 'reset_identifier') {
//                 let user = await User.findOne({ Client_ID: clientId });
//                 if (!user) {
//                     user = new User({
//                         Client_ID: clientId,
//                         Identifier: 'IDENTIFIER-' + Math.random().toString(36).substring(2, 15),
//                     });
//                     await user.save();
//                     await interaction.reply({ content: `Identifier ถูกสร้างสำหรับการทดสอบ: ${user.Identifier}`, ephemeral: true });
//                 } else {
//                     const oldIdentifier = user.Identifier;
//                     user.Last_Identifier = oldIdentifier;
//                     user.Identifier = 'IDENTIFIER-' + Math.random().toString(36).substring(2, 15);
//                     await user.save();
//                     await interaction.reply({ content: `Identifier รีเซ็ตแล้ว! เก่า: ${oldIdentifier} -> ใหม่: ${user.Identifier}`, ephemeral: true });
//                 }
//             }

//             // ฟีเจอร์ Claim Monthly
//             else if (interaction.customId === 'claim_monthly') {
//                 const now = Date.now();
//                 const cooldown = ms('30d');

//                 let user = await User.findOne({ Client_ID: clientId });
//                 if (!user) {
//                     user = new User({ Client_ID: clientId });
//                 }

//                 if (user.Blacklisted) {
//                     await interaction.reply({ content: 'คุณถูกแบนและไม่สามารถรับรางวัลได้!', ephemeral: true });
//                     return;
//                 }

//                 const lastClaim = user.Cooldown || 0;
//                 if (now - lastClaim < cooldown) {
//                     const timeLeft = ms(cooldown - (now - lastClaim), { long: true });
//                     await interaction.reply({ content: `คุณสามารถรับรางวัลได้อีกครั้งใน ${timeLeft}!`, ephemeral: true });
//                 } else {
//                     user.Cooldown = now;
//                     user.Points += 20;
//                     await user.save();
//                     await interaction.reply({ content: `รับรางวัลรายเดือนสำเร็จ! คุณได้รับ 20 Points! ตอนนี้คุณมี ${user.Points} Points.`, ephemeral: true });
//                 }
//             }

//             // ฟีเจอร์ Leaderboard
//             else if (interaction.customId === 'leaderboard') {
//                 const leaderboard = await User.find()
//                     .sort({ Licenses: -1 })
//                     .limit(5);

//                 if (leaderboard.length === 0) {
//                     await interaction.reply({ content: 'Leaderboard ว่างเปล่า!', ephemeral: true });
//                     return;
//                 }

//                 const embed = new EmbedBuilder()
//                     .setTitle('🏆 Leaderboard')
//                     .setDescription(
//                         leaderboard
//                             .map((user, index) => `${index + 1}. <@${user.Client_ID}> - ${user.Licenses.length} Licenses\n` +
//                                 `Scripts: ${user.Assets.join(', ') || 'None'}\nPoints: ${user.Points}`)
//                             .join('\n\n')
//                     )
//                     .setColor('#FFD700');

//                 await interaction.reply({ embeds: [embed], ephemeral: true });
//             }
//         }

//         // จัดการ Select Menu (เลือกเกม)
//         if (interaction.isStringSelectMenu()) {
//             if (interaction.customId.startsWith('select_game_')) {
//                 try {
//                     console.log(`[INTERACTION] select_game_${interaction.user.id} started`);

//                     const clientId = interaction.user.id;
//                     const gameIndex = parseInt(interaction.values[0]);
//                     const games = config.games;

//                     if (gameIndex < 0 || gameIndex >= games.length) {
//                         console.log(`[ERROR] Invalid gameIndex: ${gameIndex}, games length: ${games.length}`);
//                         await interaction.reply({
//                             embeds: [
//                                 new EmbedBuilder()
//                                     .setTitle('📝 เกิดข้อผิดพลาด')
//                                     .setDescription('ไม่พบเกมที่เลือก! กรุณาลองใหม่อีกครั้ง')
//                                     .setColor('#FF0000')
//                             ],
//                             ephemeral: true
//                         });
//                         return;
//                     }

//                     const selectedGame = games[gameIndex];
//                     console.log(`[INFO] User ${clientId} selected game: ${selectedGame.name}`);

//                     userGameSelections.set(clientId, selectedGame);

//                     const modal = new ModalBuilder()
//                         .setCustomId(`purchase_form_${clientId}`)
//                         .setTitle('กรอกข้อมูลการซื้อสคริปต์');

//                     const walletLinkInput = new TextInputBuilder()
//                         .setCustomId('wallet_link')
//                         .setLabel('ลิงค์ อังเปา True Wallet')
//                         .setStyle(TextInputStyle.Short)
//                         .setPlaceholder('เช่น https://gift.truemoney.com/...')
//                         .setRequired(true);

//                     const firstRow = new ActionRowBuilder().addComponents(walletLinkInput);
//                     modal.addComponents(firstRow);

//                     console.log(`[INFO] Showing modal for user ${clientId}`);
//                     await interaction.showModal(modal);
//                 } catch (error) {
//                     console.error('Error in select_game interaction:', error);
//                     await interaction.reply({
//                         embeds: [
//                             new EmbedBuilder()
//                                 .setTitle('📝 เกิดข้อผิดพลาด')
//                                 .setDescription('เกิดข้อผิดพลาดขณะเลือกเกม! กรุณาลองใหม่อีกครั้ง')
//                                 .setColor('#FF0000')
//                         ],
//                         ephemeral: true
//                     });
//                 }
//             }
//         }

//         // จัดการ Modal Submission (เมื่อผู้ใช้กด Submit ใน Modal)
//         if (interaction.isModalSubmit()) {
//             console.log(`[INFO] Modal submit interaction received: ${interaction.customId}`);
//             if (interaction.customId.startsWith('purchase_form_')) {
//                 const clientId = interaction.user.id;
//                 console.log(`[INFO] Modal submitted by user ${clientId}`);

//                 try {
//                     console.log('[INFO] Fetching wallet link from modal');
//                     const walletLink = interaction.fields.getTextInputValue('wallet_link');
//                     console.log(`[INFO] Wallet link: ${walletLink}`);

//                     console.log('[INFO] Validating wallet link');
//                     if (!walletLink.startsWith('http') || !walletLink.includes('gift.truemoney.com') || !walletLink.includes('v=')) {
//                         console.log('[ERROR] Wallet link validation failed');
//                         await interaction.reply({ content: 'กรุณาใส่ลิงค์ True Wallet ที่ถูกต้อง (เช่น https://gift.truemoney.com/campaign/?v=...)!', ephemeral: true });
//                         return;
//                     }

//                     console.log('[INFO] Checking voucher code length');
//                     const codeMatch = walletLink.match(/v=([A-Za-z0-9]+)/);
//                     if (!codeMatch || codeMatch[1].length !== 9) {
//                         console.log(`[ERROR] Invalid voucher code length: ${codeMatch ? codeMatch[1].length : 'N/A'}`);
//                         await interaction.reply({ content: 'โค้ดในลิงค์ True Wallet ต้องมีความยาว 9 ตัวอักษร (เช่น https://gift.truemoney.com/campaign/?v=XXXXXXXXX)!', ephemeral: true });
//                         return;
//                     }

//                     console.log('[INFO] Calling True Wallet API');
//                     let topUpResult;
//                     try {
//                         topUpResult = await topUpWithTrueWallet(walletLink);
//                         if (!topUpResult.success) {
//                             console.log(`[ERROR] True Wallet top up failed: ${topUpResult.message}`);
//                             await interaction.reply({
//                                 embeds: [
//                                     new EmbedBuilder()
//                                         .setTitle('📝 การเติมเงินล้มเหลว')
//                                         .setDescription(`ไม่สามารถเติมเงินได้: ${topUpResult.message}`)
//                                         .setColor('#FF0000')
//                                 ],
//                                 ephemeral: true
//                             });
//                             return;
//                         }
//                     } catch (error) {
//                         console.error('Error during True Wallet top up:', error);
//                         await interaction.reply({
//                             embeds: [
//                                 new EmbedBuilder()
//                                     .setTitle('📝 การเติมเงินล้มเหลว')
//                                     .setDescription(`เกิดข้อผิดพลาดขณะเติมเงิน: ${error.message}`)
//                                     .setColor('#FF0000')
//                             ],
//                             ephemeral: true
//                         });
//                         return;
//                     }

//                     const topUpAmount = topUpResult.amount;
//                     console.log(`[INFO] Top up successful, amount: ${topUpAmount}`);

//                     console.log('[INFO] Fetching selected game');
//                     const selectedGame = userGameSelections.get(clientId);
//                     if (!selectedGame) {
//                         console.log('[ERROR] Selected game not found');
//                         await interaction.reply({ content: 'ไม่พบข้อมูลเกมที่เลือก! กรุณาเริ่มต้นใหม่', ephemeral: true });
//                         return;
//                     }

//                     const gamePrice = selectedGame.price;
//                     const totalPoints = gamePrice;
//                     let user = await User.findOne({ Client_ID: clientId });

//                     console.log(`User Points: ${user.Points}, Total Points Needed: ${totalPoints}`);

//                     if (user.Points < totalPoints) {
//                         console.log('[ERROR] Insufficient points');
//                         await interaction.reply({ content: `คุณมี Points ไม่เพียงพอ! ต้องการ ${totalPoints} Points แต่คุณมี ${user.Points} Points`, ephemeral: true });
//                         userGameSelections.delete(clientId);
//                         return;
//                     }

//                     if (user.Assets.includes(selectedGame.value)) {
//                         console.log(`[ERROR] User already owns script: ${selectedGame.name}`);
//                         await interaction.reply({ content: `คุณมีสคริปต์ ${selectedGame.name} อยู่แล้ว!`, ephemeral: true });
//                         userGameSelections.delete(clientId);
//                         return;
//                     }

//                     // Generate License Key และ Script หลังจากซื้อสำเร็จ
//                     let generatedScript;
//                     try {
//                         generatedScript = await generateScript(clientId, selectedGame.name);
//                     } catch (error) {
//                         console.error('Error generating License Key:', error);
//                         await interaction.reply({
//                             embeds: [
//                                 new EmbedBuilder()
//                                     .setTitle('📝 เกิดข้อผิดพลาด')
//                                     .setDescription('ไม่สามารถสร้าง License Key ได้! กรุณาติดต่อแอดมิน')
//                                     .setColor('#FF0000')
//                             ],
//                             ephemeral: true
//                         });
//                         userGameSelections.delete(clientId);
//                         return;
//                     }

//                     // หัก Points และเพิ่มสคริปต์
//                     user.Points -= totalPoints;
//                     user.Assets.push(selectedGame.value);
//                     user.Licenses.push(generatedScript.licenseKey); // เพิ่ม License Key ลงใน Licenses ของผู้ใช้

//                     // เพิ่ม Role ให้ผู้ใช้
//                     try {
//                         const member = interaction.guild.members.cache.get(clientId);
//                         const buyerRoleId = config['buyers-roles'];
//                         await member.roles.add(buyerRoleId);
//                         console.log(`Added Buyer role (${buyerRoleId}) to user ${clientId}`);
//                     } catch (error) {
//                         console.error(`Failed to add Buyer role to user ${clientId}:`, error);
//                         await interaction.reply({ content: `ซื้อสคริปต์สำเร็จ แต่ไม่สามารถเพิ่ม Role ให้คุณได้ กรุณาติดต่อแอดมิน! คุณใช้ ${totalPoints} Points (เหลือ ${user.Points} Points)`, ephemeral: true });
//                         userGameSelections.delete(clientId);
//                         return;
//                     }

//                     await user.save();

//                     userGameSelections.delete(clientId);

//                     await interaction.reply({
//                         embeds: [
//                             new EmbedBuilder()
//                                 .setTitle('📝 ซื้อสคริปต์สำเร็จ')
//                                 .setDescription(
//                                     `คุณได้รับ ${selectedGame.name} และ Role Buyer\n` +
//                                     `คุณใช้ ${totalPoints} Points (เหลือ ${user.Points} Points)\n` +
//                                     `เติมเงินผ่าน True Wallet: ${topUpAmount} บาท\n\n` +
//                                     `**License Key: ${generatedScript.licenseKey}**\n` +
//                                     `**สคริปต์ของคุณ**\n` +
//                                     `\`\`\`lua\n${generatedScript.scriptContent}\n\`\`\``
//                                 )
//                                 .setColor('#00FF00')
//                         ],
//                         ephemeral: true
//                     });
//                     console.log(`[INFO] Purchase successful for user ${clientId}`);
//                 } catch (error) {
//                     console.error('Error in purchase_form submission:', error);
//                     await interaction.reply({
//                         embeds: [
//                             new EmbedBuilder()
//                                 .setTitle('📝 เกิดข้อผิดพลาด')
//                                 .setDescription(`เกิดข้อผิดพลาด: ${error.message}`)
//                                 .setColor('#FF0000')
//                         ],
//                         ephemeral: true
//                     });
//                     userGameSelections.delete(clientId);
//                 }
//             } else {
//                 console.log(`[INFO] Modal submit ignored, customId does not match: ${interaction.customId}`);
//             }
//         }
//     },
// };

