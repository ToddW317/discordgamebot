const { spawn } = require('child_process');

console.log('🚀 Starting Discord Bot on Railway...');

// First deploy commands
console.log('📤 Deploying slash commands...');
const deployProcess = spawn('node', ['deploy-commands.js'], { stdio: 'inherit' });

deployProcess.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Commands deployed successfully!');
        console.log('🤖 Starting bot...');
        
        // Then start the bot
        const botProcess = spawn('node', ['index.js'], { stdio: 'inherit' });
        
        botProcess.on('close', (code) => {
            console.log(`Bot process exited with code ${code}`);
        });
        
        botProcess.on('error', (error) => {
            console.error('Bot error:', error);
        });
    } else {
        console.error('❌ Failed to deploy commands');
        process.exit(1);
    }
});

deployProcess.on('error', (error) => {
    console.error('Deploy error:', error);
    process.exit(1);
}); 