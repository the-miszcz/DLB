const nacl = require('tweetnacl');

const leaderboardCommandHandler = require('./_display_leaderboard.cjs');
const createLeaderboardCommandHandler = require('./_create_leaderboard.cjs');
const deleteLeaderboardCommandHandler = require('./_delete_leaderboard.cjs');
const addEntryCommandHandler = require('./_add_entry.cjs');
const removeEntryCommandHandler = require('./_remove_entry.cjs');

exports.handler = async (event, context, callback) => {
// Checking signature (requirement 1.)
// Your public key can be found on your application in the Developer Portal
  const PUBLIC_KEY = process.env.PUBLIC_KEY;
  const signature = event.headers['x-signature-ed25519']
  const timestamp = event.headers['x-signature-timestamp'];
  const strBody = event.body; // should be string, for successful sign

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + strBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex')
  );

  if (!isVerified) {
    return {
      statusCode: 401,
      body: JSON.stringify('invalid request signature'),
    };
  }

// Replying to ping (requirement 2.)
  const body = JSON.parse(strBody)
  if (body.type == 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ "type": 1 }),
    }
  }

// Handle /display_leaderboard Command
if (body.data.name == 'display_leaderboard') {
  return leaderboardCommandHandler(body);
}

// Handle /create_leaderboard Command
if (body.data.name == 'create_leaderboard') {
  return createLeaderboardCommandHandler(body);
}

// Handle /delete_leaderboard Command
if (body.data.name == 'delete_leaderboard') {
  return deleteLeaderboardCommandHandler(body);
}

// Handle /add_entry Command
if (body.data.name == 'add_entry') {
  return addEntryCommandHandler(body);
}

// Handle /remove_entry Command
if (body.data.name == 'remove_entry') {
  return removeEntryCommandHandler(body);
}

// END OF FILE
  return {
    statusCode: 404, // If no handler implemented for Discord's request
    body: JSON.stringify('Not Found'),
  };
};
