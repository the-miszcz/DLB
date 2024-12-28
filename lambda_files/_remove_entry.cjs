const { loadLeaderboard, saveLeaderboard } = require('./leaderboard_io.cjs');
const { displayLeaderboard } = require('./display.cjs');

// Command handler for removing an entry from a leaderboard
module.exports = async function (body) {
    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const userOption = body.data.options.find((option) => option.name === 'user');

    const leaderboardName = leaderboardOption.value.trim();
    const userId = userOption.value.trim();

    // Load the leaderboard data from DynamoDB
    const leaderboard = await loadLeaderboard(leaderboardName);

    // Check if the leaderboard exists
    if (Object.keys(leaderboard).length === 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `Leaderboard \`${leaderboardName}\` does not exist.` },
            }),
        };
    }

    // Check if the user exists in the leaderboard
    if (!(userId in leaderboard['times'])) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `User <@${userId}> not found in leaderboard \`${leaderboardName}\`.` },
            }),
        };
    }

    // Remove the entry from the leaderboard
    delete leaderboard['times'][userId];

    // Save the updated leaderboard data to DynamoDB
    await saveLeaderboard(leaderboardName, leaderboard);

    const displayMessage = `User <@${userId}> has been removed from leaderboard \`${leaderboardName}\`.`;

    return await displayLeaderboard(leaderboardName, displayMessage);
}
