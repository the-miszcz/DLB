const { createTableIfNotExists, loadLeaderboard, saveLeaderboard } = require('./leaderboard_io.cjs');

// Command handler for creating a new leaderboard
module.exports = async function (body) {
    await createTableIfNotExists()

    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const descriptionOption = body.data.options.find((option) => option.name === 'description');
    const leaderboardName = leaderboardOption.value.trim();
    const descriptionName = descriptionOption.value.trim();

    // Load the leaderboard data from DynamoDB
    const leaderboard = await loadLeaderboard(leaderboardName);

    // Check if the leaderboard already exists
    if (Object.keys(leaderboard).length > 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `Leaderboard \`${leaderboardName}\` already exists.` },
            }),
        };
    }

    // Create a new leaderboard
    const newLeaderboard = { description: descriptionName, times: {} };

    // Save the new leaderboard data to DynamoDB
    await saveLeaderboard(leaderboardName, newLeaderboard);

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: { content: `Leaderboard \`${leaderboardName}\` has been created.` },
        }),
    };
};
