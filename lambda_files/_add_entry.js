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

// Helper function to save leaderboard data to DynamoDB
async function saveLeaderboard(leaderboardName, leaderboardData) {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            LeaderboardName: { S: leaderboardName },
            Data: { S: JSON.stringify(leaderboardData) },
        },
    };

    await dynamoDBClient.send(new PutItemCommand(params));
}

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

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: { content: successMessage },
        }),
    };
};
