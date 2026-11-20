import { StreamChat } from 'stream-chat';

// Initialize Stream Chat client
const streamClient = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);
let connectionPromise = null;

export const connectUser = async (user, token) => {
  const userId = String(user?._id || user?.id || "");
  if (!userId) throw new Error("A user ID is required to connect to Stream");

  if (connectionPromise) {
    try {
      await connectionPromise;
    } catch {
      // Allow the caller to retry a connection that failed elsewhere.
    }
    if (streamClient.userID === userId && streamClient.user) return streamClient;
  }

  if (streamClient.userID === userId && streamClient.user) return streamClient;
  if (streamClient.userID && streamClient.userID !== userId) {
    await streamClient.disconnectUser();
  }

  const pendingConnection = streamClient.connectUser(
    {
      id: userId,
      name: user.fullName,
      image: user.profilePic,
    },
    token
  );
  connectionPromise = pendingConnection;

  try {
    await pendingConnection;
    return streamClient;
  } catch (error) {
    console.error("Error connecting user to Stream:", error);
    throw error;
  } finally {
    if (connectionPromise === pendingConnection) connectionPromise = null;
  }
};

export const disconnectUser = async () => {
  try {
    await streamClient.disconnectUser();
  } catch (error) {
    console.error('Error disconnecting user from Stream:', error);
  }
};

export { streamClient };