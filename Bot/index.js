const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./config.json');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// ตรวจสอบว่ามี environment variables ครบหรือไม่
if (!process.env.BOT_TOKEN || !process.env.MONGODB_URI) {
    console.error('Missing required environment variables!');
    process.exit(1);
}

if (!config.clientId) {
    console.error('Missing clientId in config.json!');
    process.exit(1);
}

// เชื่อมต่อ MongoDB (ใช้ Database ZetaHub)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB (Database: ZetaHub)'))
    .catch(err => console.error('MongoDB connection error:', err));

// โหลดคำสั่งจากโฟลเดอร์ commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
}

// เมื่อบอทพร้อม
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`Seriality | Seriality.AI`, { type: "LISTENING" });

    const commands = client.commands.map(command => command.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Started refreshing application (/) commands for clientId: ${config.clientId}`);
        // ใช้ Guild-specific Commands เพื่อให้อัปเดตทันที
        await rest.put(Routes.applicationGuildCommands(config.clientId, "939599164042510346"), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing application commands:', error);
    }
});

// จัดการการโต้ตอบ (Slash Commands, Button, StringSelectMenu, ModalSubmit)
client.on('interactionCreate', async interaction => {
    console.log(`[INFO] Interaction received: ${interaction.type}, Custom ID: ${interaction.customId || interaction.commandName}`);

    // จัดการ Slash Commands
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.log(`[INFO] Command not found: ${interaction.commandName}`);
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });
            await command.execute(interaction);
        } catch (error) {
            console.error(`[ERROR] Error executing command ${interaction.commandName}:`, error);
            await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        return;
    }

    // จัดการ Button, StringSelectMenu, และ ModalSubmit
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        const command = client.commands.get('setup'); // คำสั่ง setup มี handleInteraction
        if (command && command.handleInteraction) {
            try {
                await command.handleInteraction(interaction, client);
            } catch (error) {
                console.error(`[ERROR] Error handling interaction:`, error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'เกิดข้อผิดพลาดขณะจัดการคำสั่ง! กรุณาลองใหม่อีกครั้ง',
                        ephemeral: true
                    });
                }
            }
        } else {
            console.log(`[INFO] No handleInteraction found for command 'setup'`);
        }
        return;
    }

    console.log(`[INFO] Interaction ignored: ${interaction.type}, Custom ID: ${interaction.customId}`);
});

// ล็อกอินบอท
client.login(process.env.BOT_TOKEN);