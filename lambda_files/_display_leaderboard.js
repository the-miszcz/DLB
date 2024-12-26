const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, PutItemCommand, GetItemCommand, WaiterState } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: 'us-west-2' });
const TABLE_NAME = 'LeaderboardTable';

// Helper function to load leaderboard data from DynamoDB
async function loadLeaderboard(leaderboardName) {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            LeaderboardName: { S: leaderboardName },
        },
    };

    const result = await dynamoDBClient.send(new GetItemCommand(params));
    return result.Item ? JSON.parse(result.Item.Data.S) : {}; // Return the data if found, otherwise an empty object
}

// Function to convert time string to total milliseconds
function timeToMilliseconds(timeStr) {
    const [minutes, secondsMilliseconds] = timeStr.split(":");
    const [seconds, milliseconds] = secondsMilliseconds.split(".");
    return parseInt(minutes) * 60 * 1000 + parseInt(seconds) * 1000 + parseInt(milliseconds);
}

// Command handler for displaying a leaderboard
module.exports = async function (body) {
    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const leaderboardName = leaderboardOption.value.trim();

    // Load the leaderboard data from DynamoDB
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

    // Sort the dictionary by the converted time values
    const sortedTimesArray = Object.entries(leaderboard['times']).sort(([, timeA], [, timeB]) => {
        return timeToMilliseconds(timeA) - timeToMilliseconds(timeB);
    });

    function formatDiscordEmbed(leaderboardName, description, sortedTimesArray) {
        const fields = sortedTimesArray.map(([userID, time], index) => ({
            name: `#${index + 1}: <@${userID}>`,
            value: `Time: ${time}`,
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
                embeds: [embedMessage],
            },
        }),
    };
};
