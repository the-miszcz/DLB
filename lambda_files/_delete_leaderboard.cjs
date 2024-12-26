const { deleteLeaderboard, loadLeaderboard } = require('./leaderboard_io.cjs');

// Command handler for removing a leaderboard
module.exports = async function (body) {
    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const leaderboardName = leaderboardOption.value.trim();

    // Load the leaderboard data from DynamoDB
    const leaderboard = await loadLeaderboard(leaderboardName);

    // Check if the leaderboard exists
    if (!leaderboard[leaderboardName]) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `Leaderboard \`${leaderboardName}\` does not exist.` },
            }),
        };
    }

    await deleteLeaderboard(leaderboardName);

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: { content: `Leaderboard \`${leaderboardName}\` has been removed.` },
        }),
    };
};
