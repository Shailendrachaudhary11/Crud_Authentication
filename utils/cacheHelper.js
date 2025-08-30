// utils/cacheHelper.js
const client = require("../redis/redisClient");

const cacheHelper = async () => {
  try {
    const keys = await client.keys("posts:all*"); // all cached list pages
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑 Cleared ${keys.length} cached post keys`);
    }

    // also clear top posts cache
    await client.del(["top:commented:post", "top:liked:post"]);
  } catch (err) {
    console.error("Redis cache invalidation error:", err.message);
  }
};

module.exports = cacheHelper;  // ✅ ab sahi
