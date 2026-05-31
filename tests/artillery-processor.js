const { encode } = require("@msgpack/msgpack");

function generateJoinMessage(context, events, done) {
  const roomId = "workspace-demo";
  const peerId = `artillery-peer-${Math.random().toString(36).slice(2, 8)}`;
  
  const msgObj = {
    type: "room:join",
    payload: {
      roomId,
      peerId
    }
  };

  // Serialize message into a binary MessagePack Buffer
  const buffer = encode(msgObj);
  
  // Store inside session variable for the YAML script
  context.vars.joinPayload = buffer;
  return done();
}

module.exports = {
  generateJoinMessage
};
