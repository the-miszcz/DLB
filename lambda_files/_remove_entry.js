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
                data: { content: `User \`${userId}\` not found in leaderboard \`${leaderboardName}\`.` },
            }),
        };
    }

    // Remove the entry from the leaderboard
    delete leaderboard['times'][userId];

    // Save the updated leaderboard data to DynamoDB
    await saveLeaderboard(leaderboardName, leaderboard);

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: { content: `User \`${userId}\` has been removed from leaderboard \`${leaderboardName}\`.` },
        }),
    };
}
