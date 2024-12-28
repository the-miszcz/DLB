const nacl = require('tweetnacl');

const commandHandlers = {
  display_leaderboard: require('./_display_leaderboard.cjs'),
  create_leaderboard: require('./_create_leaderboard.cjs'),
  delete_leaderboard: require('./_delete_leaderboard.cjs'),
  add_entry: require('./_add_entry.cjs'),
  remove_entry: require('./_remove_entry.cjs'),
};

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

  const handler = commandHandlers[body.data.name];
  if (handler) {
      return handler(body);
  }

  return {
    statusCode: 404, // If no handler implemented for Discord's request
    body: JSON.stringify('Not Found'),
  };
};
