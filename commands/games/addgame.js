const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addgame')
        .setDescription('Add a game to the party game list')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('The name of the game to add')
                .setRequired(true)),
    async execute(interaction) {
        const gameName = interaction.options.getString('game');
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '..', '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Path to the games data file
        const dataPath = path.join(dataDir, `games_${guildId}.json`);
        
        // Load existing games or create new object
        let gamesData = { games: [], votes: {} };
        if (fs.existsSync(dataPath)) {
            try {
                const rawData = fs.readFileSync(dataPath, 'utf8');
                gamesData = JSON.parse(rawData);
            } catch (error) {
                console.error('Error reading games data:', error);
                gamesData = { games: [], votes: {} };
            }
        }
        
        // Initialize guild games if not exists
        if (!gamesData.games) {
            gamesData.games = [];
        }
        if (!gamesData.votes) {
            gamesData.votes = {};
        }
        
        // Check if game already exists
        const existingGame = gamesData.games.find(g => g.name.toLowerCase() === gameName.toLowerCase());
        if (existingGame) {
            return await interaction.reply({
                content: `🎮 **${gameName}** is already in the game list!`,
                ephemeral: true
            });
        }
        
        // Add the game
        gamesData.games.push({
            name: gameName,
            addedBy: userId,
            addedAt: new Date().toISOString()
        });
        
        // Save the data
        fs.writeFileSync(dataPath, JSON.stringify(gamesData, null, 2));
        
        // Create embed response
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Game Added!')
            .setDescription(`**${gameName}** has been added to the party game list!`)
            .addFields(
                { name: 'Total Games', value: `${gamesData.games.length}`, inline: true },
                { name: 'Added By', value: `<@${userId}>`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
}; 