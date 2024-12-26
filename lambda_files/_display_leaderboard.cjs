const { displayLeaderboard } = require('./leaderboard_io.cjs');

// Command handler for displaying a leaderboard
module.exports = async function (body) {
    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const leaderboardName = leaderboardOption.value.trim();

    return await displayLeaderboard(leaderboardName);
};
