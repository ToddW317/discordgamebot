const fs = require('fs');
const path = require('path');

// Ensure data directory exists and return the path to a guild's data file
function getGuildDataPath(guildId) {
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    return path.join(dataDir, `games_${guildId}.json`);
}

// Load guild data from file or return empty structure
function loadGuildData(guildId) {
    const dataPath = getGuildDataPath(guildId);
    
    if (fs.existsSync(dataPath)) {
        try {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            console.error(`Error reading guild data for ${guildId}:`, error);
            return { games: [], votes: {} };
        }
    }
    
    return { games: [], votes: {} };
}

// Save guild data to file
function saveGuildData(guildId, data) {
    const dataPath = getGuildDataPath(guildId);
    
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error saving guild data for ${guildId}:`, error);
        throw error;
    }
}

module.exports = {
    getGuildDataPath,
    loadGuildData,
    saveGuildData
}; 