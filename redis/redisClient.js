const redis = require("redis");

const client = redis.createClient({
  url: "redis://127.0.0.1:6379",
});

client.on("error", (err) => console.error("Redis Client Error", err));
client.on("connect", () => console.log("✅ Redis Connected"));

(async () => {
  if (!client.isOpen) {
    await client.connect();
  }
})();

module.exports = client;
