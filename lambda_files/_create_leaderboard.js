const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, PutItemCommand, GetItemCommand, WaiterState } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: 'us-west-2' });
const TABLE_NAME = 'LeaderboardTable';

// Helper function to create the leaderboard table if it does not exist
async function createTableIfNotExists() {
    const params = {
        TableName: TABLE_NAME,
        KeySchema: [
            { AttributeName: 'LeaderboardName', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
            { AttributeName: 'LeaderboardName', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    try {
        await dynamoDBClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    } catch (err) {
        if (err.name === 'ResourceNotFoundException') {
            await dynamoDBClient.send(new CreateTableCommand(params));
            console.log(`Table ${TABLE_NAME} created successfully.`);

            // Wait for the table to be active
            await dynamoDBClient.waitFor('tableExists', { TableName: TABLE_NAME });
        } else {
            throw err;
        }
    }
}

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

// Command handler for creating a new leaderboard
module.exports = async function (body) {
    await createTableIfNotExists();

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
