const { DynamoDBClient, DeleteItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

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
    return result.Item ? JSON.parse(result.Item.Data.S) : null; // Return the data if found, otherwise null
}

// Command handler for removing a leaderboard
module.exports = async function (body) {
    const leaderboardOption = body.data.options.find((option) => option.name === 'leaderboard');
    const leaderboardName = leaderboardOption.value.trim();

    // Load the leaderboard data from DynamoDB
    const leaderboard = await loadLeaderboard(leaderboardName);

    // Check if the leaderboard exists
    if (!leaderboard) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                type: 4,
                data: { content: `Leaderboard \`${leaderboardName}\` does not exist.` },
            }),
        };
    }

    // Delete the leaderboard from DynamoDB
    const deleteParams = {
        TableName: TABLE_NAME,
        Key: {
            LeaderboardName: { S: leaderboardName },
        },
    };

    await dynamoDBClient.send(new DeleteItemCommand(deleteParams));

    return {
        statusCode: 200,
        body: JSON.stringify({
            type: 4,
            data: { content: `Leaderboard \`${leaderboardName}\` has been removed.` },
        }),
    };
};
