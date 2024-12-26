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
                content: extraInfo,
                embeds: [embedMessage],
            },
        }),
    };
}

module.exports = { createTableIfNotExists, loadLeaderboard, saveLeaderboard, deleteLeaderboard, displayLeaderboard };
