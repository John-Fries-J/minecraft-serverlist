const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const util = require('minecraft-server-util');
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

        try {
            const response = await util.status(serverIP, serverPort, {
                timeout: 15000,
                enableSRV: true
            });

            const players = response.players.sample || [];
            const playerCount = response.players.online || 0;
            const maxPlayers = response.players.max || 0;

            let playerList = players.length > 0 
                ? players.map(p => `• ${p.name}`).join('\n')
                : 'No players online';

            const embed = new EmbedBuilder()
                .setTitle('Minecraft Server Player List 🌐')
                .setDescription(`Server: **${serverIP}:${serverPort}**\nNote: For proxy servers (BungeeCord/Velocity) this will only show total players`)
                .addFields(
                    { name: 'Status', value: '✅ Online', inline: true },
                    { name: 'Players', value: `${playerCount}/${maxPlayers}`, inline: true },
                    { name: 'Sample Players', value: playerList },
                    { name: 'Version', value: response.version.name || 'Unknown' }
                )
                .setColor(blue)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('Minecraft Server Player List 🌐')
                .setDescription(`Server: **${serverIP}:${serverPort}**`)
                .addFields(
                    { name: 'Status', value: '❌ Offline or unreachable' },
                    { name: 'Error', value: `${error.message}` },
                    { name: 'Error Code', value: `${error.code || 'No code'}` },
                    { name: 'Stack', value: `${error.stack.split('\n')[0] || 'No stack'}` }
                )
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};