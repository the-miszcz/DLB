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
        // Handy tool to get a nice embed: https://glitchii.github.io/embedbuilder/
        const standings = sortedTimesArray.map(([userID, time], index) => `#${index + 1}: <@${userID}> - ${time}`).join('\n');

        const fields = [
            {
                name: `Standings`,
                value: standings || "No entries available.",
                inline: false,
            }
        ];

        return {
            title: leaderboardName,
            description: description || "",
            fields: fields,
            color: 16457014, // A nice red color matching bot's avatar
            thumbnail: {url: "https://cdn3.iconfinder.com/data/icons/sports-recreation-1/128/checkered-flag-512.png"},
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
