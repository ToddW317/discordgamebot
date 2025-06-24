const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listgames')
        .setDescription('Show all games in the party game list'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 The game list is empty! Use `/addgame` to add some games.',
                ephemeral: true
            });
        }
        
        // Load games data
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        if (!gamesData.games || gamesData.games.length === 0) {
            return await interaction.reply({
                content: '📋 The game list is empty! Use `/addgame` to add some games.',
                ephemeral: true
            });
        }
        
        // Create pages if there are many games
        const gamesPerPage = 10;
        const totalPages = Math.ceil(gamesData.games.length / gamesPerPage);
        const page = 1; // Start with page 1
        
        const startIndex = (page - 1) * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const gamesOnPage = gamesData.games.slice(startIndex, endIndex);
        
        // Create the embed
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🎮 Party Game List')
            .setDescription(`Total games: **${gamesData.games.length}**`)
            .setFooter({ text: `Page ${page} of ${totalPages}` })
            .setTimestamp();
        
        // Add games as fields
        gamesOnPage.forEach((game, index) => {
            const globalIndex = startIndex + index + 1;
            let voteText = '';
            
            // Check if game has votes
            if (gamesData.votes && gamesData.votes[game.name]) {
                const votes = gamesData.votes[game.name].totalVotes;
                const bonus = Math.min(votes * 10, 50);
                voteText = `\n🗳️ Votes: ${votes} (+${bonus}%)`;
            }
            
            embed.addFields({
                name: `${globalIndex}. ${game.name}`,
                value: `Added by <@${game.addedBy}>${voteText}`,
                inline: true
            });
        });
        
        await interaction.reply({ embeds: [embed] });
    },
}; 