const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset the game list - removes all games and votes (requires confirmation)'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        
        // Path to the games data file
        const dataPath = path.join(__dirname, '..', '..', 'data', `games_${guildId}.json`);
        
        // Check if data file exists
        if (!fs.existsSync(dataPath)) {
            return await interaction.reply({
                content: '📋 There is no game data to reset!',
                ephemeral: true
            });
        }
        
        // Load games data to show what will be deleted
        const rawData = fs.readFileSync(dataPath);
        const gamesData = JSON.parse(rawData);
        
        const gameCount = gamesData.games ? gamesData.games.length : 0;
        const voteCount = gamesData.votes ? Object.values(gamesData.votes).reduce((sum, vote) => sum + vote.totalVotes, 0) : 0;
        
        if (gameCount === 0) {
            return await interaction.reply({
                content: '📋 The game list is already empty!',
                ephemeral: true
            });
        }
        
        // Create confirmation buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_reset')
                    .setLabel('Confirm Reset')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚠️'),
                new ButtonBuilder()
                    .setCustomId('cancel_reset')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌')
            );
        
        // Create warning embed
        const warningEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('⚠️ Reset Confirmation')
            .setDescription('**This action cannot be undone!**')
            .addFields(
                { name: '🎮 Games to be deleted', value: `${gameCount} games`, inline: true },
                { name: '🗳️ Votes to be cleared', value: `${voteCount} votes`, inline: true }
            )
            .setFooter({ text: 'Please confirm to proceed with the reset' })
            .setTimestamp();
        
        // Send confirmation message
        const response = await interaction.reply({
            embeds: [warningEmbed],
            components: [row],
            fetchReply: true
        });
        
        // Create a collector for button interactions
        const collectorFilter = i => i.user.id === interaction.user.id;
        
        try {
            const confirmation = await response.awaitMessageComponent({ 
                filter: collectorFilter, 
                time: 60000 // 60 seconds timeout
            });
            
            if (confirmation.customId === 'confirm_reset') {
                // User confirmed - perform the reset
                fs.unlinkSync(dataPath);
                
                // Create success embed
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Reset Complete!')
                    .setDescription('All games and votes have been cleared.')
                    .addFields(
                        { name: 'Games Removed', value: `${gameCount}`, inline: true },
                        { name: 'Votes Cleared', value: `${voteCount}`, inline: true }
                    )
                    .setFooter({ text: 'You can start adding games again with /addgame' })
                    .setTimestamp();
                
                await confirmation.update({
                    embeds: [successEmbed],
                    components: []
                });
            } else {
                // User cancelled
                const cancelEmbed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setTitle('❌ Reset Cancelled')
                    .setDescription('No changes were made to the game list.')
                    .setTimestamp();
                
                await confirmation.update({
                    embeds: [cancelEmbed],
                    components: []
                });
            }
        } catch (e) {
            // Timeout - no response
            const timeoutEmbed = new EmbedBuilder()
                .setColor(0x808080)
                .setTitle('⏱️ Reset Timed Out')
                .setDescription('No response received. The reset has been cancelled.')
                .setTimestamp();
            
            await interaction.editReply({
                embeds: [timeoutEmbed],
                components: []
            });
        }
    },
}; 