const { loadLeaderboard, saveLeaderboard, displayLeaderboard } = require('./leaderboard_io.cjs');

// Command handler for adding an entry to a leaderboard
module.exports = async function (body) {
    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const timeOption = body.data.options.find((option) => option.name === 'time');
    const userOption = body.data.options.find((option) => option.name === 'user'); // Optional user input

    const leaderboardName = leaderboardOption.value.trim();
    const timeValue = timeOption.value.trim();
    const targetUserId = userOption ? userOption.value : body.member.user.id; // Use the provided user ID or default to the caller's ID

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

    // Add the new time entry to the leaderboard
    leaderboard['times'][targetUserId] = timeValue;

    // Save the updated leaderboard data to DynamoDB
    await saveLeaderboard(leaderboardName, leaderboard);

    const successMessage = userOption
        ? `Time entry \`${timeValue}\` has been added to leaderboard \`${leaderboardName}\` for <@${targetUserId}>.`
        : `Time entry \`${timeValue}\` has been added to leaderboard \`${leaderboardName}\`.`;

    return await displayLeaderboard(leaderboardName, successMessage);
};
