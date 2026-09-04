import redisClient from "../db/redis.js";

/**
 * Key naming convention (keep this documented and consistent):
 * channel:profile:<username>
 * dashboard:stats:<userId>
 * view:debounce:<userId>:<videoId>
 * otp:reset:<userId>
 */

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Redis GET failed for key ${key}:`, error.message);
    return null; // fail silently -> caller falls back to DB
  }
};

const setCache = async (key, value, ttlSeconds = 60) => {
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error(`Redis SET failed for key ${key}:`, error.message);
    // no throw — caching failure should never break the request
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Redis DEL failed for key ${key}:`, error.message);
  }
};

/**
 * Atomically sets a key only if it doesn't already exist (NX) with a TTL.
 * Returns true if the key was newly set (i.e., action should proceed),
 * false if the key already existed (i.e., action was already done recently).
 *
 * Fail-open on Redis errors: if Redis is unreachable, we return true so the
 * caller proceeds normally rather than the request failing outright. This
 * means debounce protection is temporarily lost during a Redis outage —
 * an acceptable tradeoff since view-count deduplication is an optimization,
 * not a correctness guarantee the app depends on.
 */
const setIfNotExists = async (key, ttlSeconds) => {
  try {
    const result = await redisClient.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch (error) {
    console.error(`Redis SET NX failed for key ${key}:`, error.message);
    return true;
  }
};

export { getCache, setCache, deleteCache, setIfNotExists };