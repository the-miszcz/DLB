const { loadLeaderboard } = require('./leaderboard_io.cjs');

// Function to display a leaderboard
async function displayLeaderboard(leaderboardName, extraInfo = "") {
    const leaderboard = await loadLeaderboard(leaderboardName);

    // Check if the leaderboard exists
    if (Object.keys(leaderboard).length === 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `Leaderboard \`${leaderboardName}\` does not exist or has no data.` },
            }),
        };
    }

    // Function to convert time string to total milliseconds
    function timeToMilliseconds(timeStr) {
        const [minutes, secondsMilliseconds] = timeStr.split(":");
        const [seconds, milliseconds] = secondsMilliseconds.split(".");
        return parseInt(minutes) * 60 * 1000 + parseInt(seconds) * 1000 + parseInt(milliseconds);
    }

    // Sort the dictionary by the converted time values
    const sortedTimesArray = Object.entries(leaderboard['times']).sort(([, timeA], [, timeB]) => {
        return timeToMilliseconds(timeA) - timeToMilliseconds(timeB);
    });

    // Helper function to format the leaderboard data into a Discord message
    function formatDiscordEmbed(leaderboardName, description, sortedTimesArray) {
        const fields = sortedTimesArray.map(([userID, time], index) => ({
                name: `#${index + 1}`,
                value: `<@${userID}>: ${time}`,
                inline: false,
        }));

        return {
            title: `Leaderboard: ${leaderboardName}`,
            description: description || "",
            fields: fields,
            color: 3066993, // A nice green color
        };
    }

    const embedMessage = formatDiscordEmbed(leaderboardName, leaderboard["description"], sortedTimesArray);
    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: {
                content: extraInfo,
                embeds: [embedMessage],
            },
        }),
    };
}

module.exports = { displayLeaderboard };
