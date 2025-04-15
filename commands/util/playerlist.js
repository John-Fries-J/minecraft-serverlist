const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { blue } = require('../../colors.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerlist')
        .setDescription('Shows the player list of a Minecraft server')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('The server IP address')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('port')
                .setDescription('The server port (default: 25565)')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        const serverIP = interaction.options.getString('ip');
        const rawPort = interaction.options.getInteger('port');
        const serverPort = rawPort && !isNaN(rawPort) ? rawPort : 25565;
        const serverAddress = `${serverIP}:${serverPort}`;

        try {
            // Fetch status from mcstatus.io API
            const response = await axios.get(`https://api.mcstatus.io/v2/status/java/${serverAddress}`);
            const data = response.data;

            if (!data.online) {
                throw new Error('Server is offline');
            }

            const players = data.players.list || [];
            const playerCount = data.players.online || 0;
            const maxPlayers = data.players.max || 0;

            let playerList = players.length > 0 
                ? players.map(p => `• ${p.name_clean}`).join('\n')
                : 'No players online';

            const embed = new EmbedBuilder()
                .setTitle('Minecraft Server Player List 🌐')
                .setDescription(`Server: **${serverAddress}**`)
                .addFields(
                    { name: 'Status', value: '✅ Online', inline: true },
                    { name: 'Players', value: `${playerCount}/${maxPlayers}`, inline: true },
                    { name: 'Online Players', value: playerList },
                    { name: 'Version', value: data.version?.name_raw || 'Unknown' }
                )
                .setColor(blue)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('Minecraft Server Player List 🌐')
                .setDescription(`Server: **${serverAddress}**`)
                .addFields(
                    { name: 'Status', value: '❌ Offline or unreachable' },
                    { name: 'Error', value: `${error.message}` }
                )
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};