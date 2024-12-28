const { loadLeaderboard } = require('./leaderboard_io.cjs');

// Function to convert time string to total milliseconds
const timeToMilliseconds = (timeStr) => {
    const [minutes, secondsMilliseconds] = timeStr.split(":");
    const [seconds, milliseconds] = secondsMilliseconds.split(".");
    return parseInt(minutes) * 60 * 1000 + parseInt(seconds) * 1000 + parseInt(milliseconds);
}

// Helper function to format the leaderboard data into a Discord message
const formatDiscordEmbed = (leaderboardName, description, sortedTimesArray) => {
    // Handy tool to get a nice embed: https://glitchii.github.io/embedbuilder/
    const standings = sortedTimesArray
        .map(([userID, time], index) => `#${index + 1}: <@${userID}> - ${time}`)
        .join('\n') || "No entries available.";

    return {
        title: leaderboardName,
        description: description || "",
        fields: [{ name: "Standings", value: standings, inline: false }],
        color: 16457014, // Red color
        thumbnail: { url: "https://cdn3.iconfinder.com/data/icons/sports-recreation-1/128/checkered-flag-512.png" },
    };
}

// Function to display a leaderboard
async function displayLeaderboard(leaderboardName, extraInfo = "") {
    const leaderboard = await loadLeaderboard(leaderboardName);

    // Check if the leaderboard exists
    if (!leaderboard || !Object.keys(leaderboard).length) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `Leaderboard \`${leaderboardName}\` does not exist or has no data.` },
            }),
        };
    }

    // Sort the dictionary by the converted time values
    const sortedTimesArray = Object.entries(leaderboard.times).sort(([, timeA], [, timeB]) => {
        return timeToMilliseconds(timeA) - timeToMilliseconds(timeB);
    });

    const embedMessage = formatDiscordEmbed(leaderboardName, leaderboard.description, sortedTimesArray);
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
