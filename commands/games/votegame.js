const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('votegame')
        .setDescription('Vote for a game to increase its selection chances')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('The name of the game to vote for')
                .setRequired(true)),
    async execute(interaction) {
        const gameName = interaction.options.getString('game');
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 The game list is empty! Use `/addgame` to add some games first.',
                ephemeral: true
            });
        }
        
        // Load games data
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        // Initialize votes object if it doesn't exist
        if (!gamesData.votes) {
            gamesData.votes = {};
        }
        
        // Find the game (case-insensitive)
        const game = gamesData.games.find(g => g.name.toLowerCase() === gameName.toLowerCase());
        
        if (!game) {
            return await interaction.reply({
                content: `❌ **${gameName}** was not found in the game list!`,
                ephemeral: true
            });
        }
        
        // Initialize game votes if not exists
        if (!gamesData.votes[game.name]) {
            gamesData.votes[game.name] = {
                voters: [],
                totalVotes: 0
            };
        }
        
        // Check if user already voted for this game
        if (gamesData.votes[game.name].voters.includes(userId)) {
            return await interaction.reply({
                content: `🚫 You have already voted for **${game.name}**!`,
                ephemeral: true
            });
        }
        
        // Add the vote
        gamesData.votes[game.name].voters.push(userId);
        gamesData.votes[game.name].totalVotes++;
        
        // Calculate bonus percentage (10% per vote, max 50%)
        const voteCount = gamesData.votes[game.name].totalVotes;
        const bonusPercentage = Math.min(voteCount * 10, 50);
        
        // Save the updated data
        fs.writeFileSync(dataPath, JSON.stringify(gamesData, null, 2));
        
        // Create embed response
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Vote Recorded!')
            .setDescription(`You voted for **${game.name}**!`)
            .addFields(
                { name: 'Total Votes', value: `${voteCount}`, inline: true },
                { name: 'Selection Bonus', value: `+${bonusPercentage}%`, inline: true },
                { name: 'Status', value: bonusPercentage >= 50 ? '🔥 MAX BONUS!' : '📈 Growing', inline: true }
            )
            .setFooter({ text: 'Each vote adds 10% selection chance (max 50%)' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
}; 