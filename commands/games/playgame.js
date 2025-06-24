const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playgame')
        .setDescription('Randomly select a game from the list for the party to play!'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        
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
        
        if (!gamesData.games || gamesData.games.length === 0) {
            return await interaction.reply({
                content: '📋 The game list is empty! Use `/addgame` to add some games first.',
                ephemeral: true
            });
        }
        
        // Calculate weighted selection based on votes
        let weightedGames = [];
        
        for (const game of gamesData.games) {
            // Base weight of 100 for each game
            let weight = 100;
            
            // Add bonus weight based on votes (10% per vote, max 50%)
            if (gamesData.votes && gamesData.votes[game.name]) {
                const voteCount = gamesData.votes[game.name].totalVotes;
                const bonusPercentage = Math.min(voteCount * 10, 50);
                weight += bonusPercentage;
            }
            
            // Add the game to weighted array based on its weight
            for (let i = 0; i < weight; i++) {
                weightedGames.push(game);
            }
        }
        
        // Randomly select from weighted array
        const randomIndex = Math.floor(Math.random() * weightedGames.length);
        const selectedGame = weightedGames[randomIndex];
        
        // Get vote info for the selected game
        let voteInfo = '';
        if (gamesData.votes && gamesData.votes[selectedGame.name]) {
            const votes = gamesData.votes[selectedGame.name].totalVotes;
            const bonus = Math.min(votes * 10, 50);
            voteInfo = `\n📊 This game had ${votes} vote${votes !== 1 ? 's' : ''} (+${bonus}% selection chance)`;
        }
        
        // Clear votes after selection (optional - remove if you want to keep votes)
        if (gamesData.votes) {
            gamesData.votes = {};
            fs.writeFileSync(path.join(__dirname, '..', '..', 'data', `games_${interaction.guildId}.json`), 
                JSON.stringify(gamesData, null, 2));
        }
        
        // Create the embed
        const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('🎲 Time to Play!')
            .setDescription(`The randomly selected game is...`)
            .addFields({
                name: '🎮 ' + selectedGame.name,
                value: `Let's play **${selectedGame.name}**! Everyone get ready!${voteInfo}`
            })
            .setFooter({ text: `Selected from ${gamesData.games.length} games | Votes have been reset` })
            .setTimestamp();
        
        // Add a fun GIF or image (optional)
        embed.setThumbnail('https://media.giphy.com/media/3o7TKUZfJKUKuSWgZG/giphy.gif');
        
        await interaction.reply({ embeds: [embed] });
    },
}; 