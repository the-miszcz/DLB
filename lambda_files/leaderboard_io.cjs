const { DeleteItemCommand, DescribeTableCommand, DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
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

// Function to delete a leaderboard from DynamoDB
async function deleteLeaderboard(leaderboardName) {
    const deleteParams = {
        TableName: TABLE_NAME,
        Key: {
            LeaderboardName: { S: leaderboardName },
        },
    };

    await dynamoDBClient.send(new DeleteItemCommand(deleteParams));
}

module.exports = { createTableIfNotExists, loadLeaderboard, saveLeaderboard, deleteLeaderboard };
