import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { cloudinary } from '../config/cloudinary.js';
import EmailLog from '../models/EmailLog.js';

export const storageEvents = new EventEmitter();
storageEvents.setMaxListeners(100);

let cachedStats = null;
let lastCalculated = 0;
let debounceTimeout = null;
let changeStream = null;

// Core calculation function for MongoDB, Cloudinary, and Brevo
export const calculateStorageStats = async (force = false) => {
  // Return cached result if fresh within 30 seconds to prevent rate limits and 2+ second remote network latency
  if (!force && cachedStats && (Date.now() - lastCalculated < 30000)) {
    return cachedStats;
  }

  let mongoStats = null;
  let cloudinaryStats = null;
  let brevoStats = null;

  // 1. MongoDB Atlas Storage Stats
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const stats = await mongoose.connection.db.stats();
      const totalLimitMB = Number(process.env.MONGODB_STORAGE_LIMIT_MB) || 512;
      const totalLimitBytes = totalLimitMB * 1024 * 1024;
      const detectedPlan = process.env.MONGODB_PLAN_NAME || (
        totalLimitMB <= 512 ? 'M0 Free' :
        totalLimitMB <= 2048 ? 'M2 Flex' :
        totalLimitMB <= 5120 ? 'M5 Flex' : 'Dedicated M10+'
      );
      
      const usedBytes = (stats.storageSize || 0) + (stats.indexSize || 0);
      const remainingBytes = Math.max(0, totalLimitBytes - usedBytes);
      const percentUsed = Number(Math.min(100, (usedBytes / totalLimitBytes) * 100).toFixed(2));
      
      mongoStats = {
        databaseName: stats.db || 'thesehatbuddy',
        plan: detectedPlan,
        totalLimitBytes,
        totalLimitMB,
        usedBytes,
        usedMB: Number((usedBytes / (1024 * 1024)).toFixed(2)),
        remainingBytes,
        remainingMB: Number((remainingBytes / (1024 * 1024)).toFixed(2)),
        percentUsed,
        dataSizeBytes: stats.dataSize || 0,
        dataSizeMB: Number(((stats.dataSize || 0) / (1024 * 1024)).toFixed(2)),
        storageSizeBytes: stats.storageSize || 0,
        storageSizeMB: Number(((stats.storageSize || 0) / (1024 * 1024)).toFixed(2)),
        indexSizeBytes: stats.indexSize || 0,
        indexSizeMB: Number(((stats.indexSize || 0) / (1024 * 1024)).toFixed(2)),
        collections: stats.collections || 0,
        objects: stats.objects || 0,
        status: percentUsed >= 90 ? 'critical' : percentUsed >= 75 ? 'warning' : 'healthy'
      };
    }
  } catch (mongoErr) {
    console.error('Error fetching MongoDB stats:', mongoErr.message);
  }

  if (!mongoStats) {
    mongoStats = {
      databaseName: 'thesehatbuddy',
      plan: 'M0 Free',
      totalLimitBytes: 512 * 1024 * 1024,
      totalLimitMB: 512,
      usedBytes: 0,
      usedMB: 0,
      remainingBytes: 512 * 1024 * 1024,
      remainingMB: 512,
      percentUsed: 0,
      dataSizeBytes: 0,
      dataSizeMB: 0,
      storageSizeBytes: 0,
      storageSizeMB: 0,
      indexSizeBytes: 0,
      indexSizeMB: 0,
      collections: 10,
      objects: 0,
      status: 'healthy'
    };
  }

  // 2. Cloudinary Media Storage Stats
  try {
    if (cloudinary && cloudinary.api && cloudinary.api.usage) {
      const usage = await cloudinary.api.usage();
      const plan = usage.plan || 'Free';
      const creditsLimit = usage.credits?.limit || 25;
      const creditsUsed = usage.credits?.usage || 0;
      const creditsRemaining = Math.max(0, Number((creditsLimit - creditsUsed).toFixed(2)));
      const creditsPercentUsed = usage.credits?.used_percent ?? Number(((creditsUsed / creditsLimit) * 100).toFixed(2));

      const totalStorageBytes = creditsLimit * 1024 * 1024 * 1024;
      const totalStorageGB = creditsLimit;
      const usedStorageBytes = usage.storage?.usage || 0;
      const usedStorageMB = Number((usedStorageBytes / (1024 * 1024)).toFixed(2));
      const usedStorageGB = Number((usedStorageBytes / (1024 * 1024 * 1024)).toFixed(3));
      const remainingStorageBytes = Math.max(0, totalStorageBytes - usedStorageBytes);
      const remainingStorageGB = Number((remainingStorageBytes / (1024 * 1024 * 1024)).toFixed(2));
      const storagePercentUsed = Number(((usedStorageBytes / totalStorageBytes) * 100).toFixed(2));

      cloudinaryStats = {
        plan,
        lastUpdated: usage.last_updated || new Date().toISOString(),
        totalLimitBytes: totalStorageBytes,
        totalLimitGB: totalStorageGB,
        usedBytes: usedStorageBytes,
        usedMB: usedStorageMB,
        usedGB: usedStorageGB,
        remainingBytes: remainingStorageBytes,
        remainingGB: remainingStorageGB,
        percentUsed: storagePercentUsed,
        credits: {
          total: creditsLimit,
          used: creditsUsed,
          remaining: creditsRemaining,
          percentUsed: creditsPercentUsed
        },
        objects: usage.objects?.usage ?? usage.resources ?? 0,
        bandwidthBytes: usage.bandwidth?.usage || 0,
        bandwidthMB: Number(((usage.bandwidth?.usage || 0) / (1024 * 1024)).toFixed(2)),
        transformations: usage.transformations?.usage || 0,
        status: creditsPercentUsed >= 90 ? 'critical' : creditsPercentUsed >= 75 ? 'warning' : 'healthy'
      };
    }
  } catch (cldErr) {
    console.error('Error fetching Cloudinary stats:', cldErr?.message || cldErr);
  }

  if (!cloudinaryStats) {
    cloudinaryStats = {
      plan: 'Free',
      totalLimitBytes: 25 * 1024 * 1024 * 1024,
      totalLimitGB: 25,
      usedBytes: 0,
      usedMB: 0,
      usedGB: 0,
      remainingBytes: 25 * 1024 * 1024 * 1024,
      remainingGB: 25,
      percentUsed: 0,
      credits: {
        total: 25,
        used: 0,
        remaining: 25,
        percentUsed: 0
      },
      objects: 0,
      bandwidthBytes: 0,
      bandwidthMB: 0,
      transformations: 0,
      status: 'healthy'
    };
  }

  // 3. Brevo Transactional Email Quota Stats
  try {
    const dailyLimit = Number(process.env.BREVO_DAILY_EMAIL_LIMIT) || 300;
    const accountEmail = process.env.EMAIL_FROM || 'thesehatbuddy@gmail.com';
    const smtpUser = process.env.BREVO_SMTP_USER || 'bc897f001@smtp-brevo.com';

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [sentToday, sentThisMonth, totalSent, totalFailed] = await Promise.all([
      EmailLog.countDocuments({ createdAt: { $gte: startOfToday }, status: 'sent' }),
      EmailLog.countDocuments({ createdAt: { $gte: startOfMonth }, status: 'sent' }),
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'failed' })
    ]);

    let planName = 'Free';
    let liveCredits = null;
    let apiConnected = false;

    const restApiKey = process.env.BREVO_REST_API_KEY || (process.env.BREVO_API_KEY?.startsWith('xkeysib-') ? process.env.BREVO_API_KEY : null);

    if (restApiKey) {
      try {
        const apiRes = await fetch('https://api.brevo.com/v3/account', {
          headers: {
            'api-key': restApiKey,
            'accept': 'application/json'
          }
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          apiConnected = true;
          if (apiData.plan && Array.isArray(apiData.plan) && apiData.plan.length > 0) {
            const primaryPlan = apiData.plan[0];
            planName = primaryPlan.type ? (primaryPlan.type.charAt(0).toUpperCase() + primaryPlan.type.slice(1)) : 'Free';
            if (primaryPlan.credits !== undefined) {
              liveCredits = primaryPlan.credits;
            }
          }
        }
      } catch (apiErr) {
        console.warn('Brevo REST API check warning:', apiErr.message);
      }
    }

    const effectiveTotalLimit = liveCredits !== null ? Math.max(liveCredits, dailyLimit) : dailyLimit;
    const effectiveUsed = sentToday;
    const effectiveRemaining = Math.max(0, effectiveTotalLimit - effectiveUsed);
    const percentUsed = Number(Math.min(100, (effectiveUsed / effectiveTotalLimit) * 100).toFixed(1));

    brevoStats = {
      provider: 'Brevo',
      accountEmail,
      smtpUser,
      smtpHost: 'smtp-relay.brevo.com:587',
      plan: planName,
      totalLimit: effectiveTotalLimit,
      sentToday: effectiveUsed,
      remainingToday: effectiveRemaining,
      percentUsed,
      sentMonth: sentThisMonth,
      sentAllTime: totalSent,
      failedAllTime: totalFailed,
      status: percentUsed >= 90 ? 'critical' : percentUsed >= 75 ? 'warning' : 'healthy',
      apiConnected,
      smtpConfigured: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SMTP_USER)
    };
  } catch (brevoErr) {
    console.error('Error fetching Brevo stats:', brevoErr?.message || brevoErr);
  }

  if (!brevoStats) {
    brevoStats = {
      provider: 'Brevo',
      accountEmail: process.env.EMAIL_FROM || 'thesehatbuddy@gmail.com',
      smtpUser: process.env.BREVO_SMTP_USER || 'bc897f001@smtp-brevo.com',
      smtpHost: 'smtp-relay.brevo.com:587',
      plan: 'Free',
      totalLimit: 300,
      sentToday: 0,
      remainingToday: 300,
      percentUsed: 0,
      sentMonth: 0,
      sentAllTime: 0,
      failedAllTime: 0,
      status: 'healthy',
      apiConnected: false,
      smtpConfigured: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SMTP_USER)
    };
  }

  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    mongodb: mongoStats,
    cloudinary: cloudinaryStats,
    brevo: brevoStats
  };

  cachedStats = result;
  lastCalculated = Date.now();
  return result;
};

// Trigger debounced notification when any database or resource changes
export const notifyStorageChanged = (source = 'mutation') => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    try {
      const freshStats = await calculateStorageStats();
      storageEvents.emit('storage_update', {
        source,
        data: freshStats
      });
    } catch (err) {
      console.error('Error during realtime storage update broadcast:', err.message);
    }
  }, 350);
};

export const realtimeEvents = new EventEmitter();
realtimeEvents.setMaxListeners(500);

const recentRealtimeEvents = new Map();
export const emitRealtimeDbChange = (payload) => {
  const coll = (payload.collection || '').toLowerCase();
  const op = payload.operation || '';
  const docId = payload.docId ? String(payload.docId) : '';
  const key = `${coll}:${op}:${docId}`;
  const now = Date.now();

  // If identical event was dispatched in the last 1200ms, suppress duplicate emission
  if (docId && recentRealtimeEvents.has(key) && (now - recentRealtimeEvents.get(key) < 1200)) {
    return;
  }
  recentRealtimeEvents.set(key, now);
  if (recentRealtimeEvents.size > 300) {
    for (const [k, v] of recentRealtimeEvents) {
      if (now - v > 5000) recentRealtimeEvents.delete(k);
    }
  }

  realtimeEvents.emit('db_change', payload);
};

export const broadcastDbChange = (collection, operation = 'update', docId = null, fullDocument = null) => {
  const payload = {
    collection: (collection || '').toLowerCase(),
    operation,
    docId: docId ? docId.toString() : null,
    fullDocument,
    timestamp: Date.now()
  };
  emitRealtimeDbChange(payload);
  notifyStorageChanged(`mutation:${collection}:${operation}`);
};

// Initialize native MongoDB Atlas Change Stream
export const initMongoDBChangeStream = () => {
  if (changeStream) {
    try { changeStream.close(); } catch {}
    changeStream = null;
  }

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Watch all collections across the database with fullDocument on updates
      changeStream = mongoose.connection.watch([], { fullDocument: 'updateLookup' });
      
      changeStream.on('change', (change) => {
        const collection = (change.ns?.coll || '').toLowerCase();
        const operation = change.operationType;
        const docId = change.documentKey?._id?.toString() || null;
        const fullDocument = change.fullDocument || null;

        // Broadcast to all connected website visitors & dashboards in real-time (deduplicated)
        emitRealtimeDbChange({
          collection,
          operation,
          docId,
          fullDocument,
          timestamp: Date.now()
        });

        // As soon as any collection receives insert, update, delete, or drop, recalculate storage
        notifyStorageChanged(`mongodb:${operation}:${collection}`);
      });

      changeStream.on('error', (err) => {
        console.warn('MongoDB change stream warning (will retry on reconnect):', err.message);
        try { changeStream.close(); } catch {}
        changeStream = null;
        setTimeout(initMongoDBChangeStream, 5000);
      });

      console.log('⚡ Realtime MongoDB Change Stream active: Database storage is now live monitored.');
    } else {
      mongoose.connection.once('open', () => {
        initMongoDBChangeStream();
      });
    }
  } catch (err) {
    console.warn('Unable to initialize MongoDB change stream:', err.message);
  }
};

// Public Server-Sent Events (SSE) route handler for whole website & all dashboards realtime updates
export const streamRealtimeDatabase = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: Date.now() })}\n\n`);

  const onDbChange = (payload) => {
    try {
      res.write(`event: db_change\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      console.error('Realtime SSE stream write error:', err.message);
    }
  };

  realtimeEvents.on('db_change', onDbChange);

  // Send periodic ping to prevent firewall/proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeEvents.off('db_change', onDbChange);
  });
};

// Server-Sent Events (SSE) route handler for real-time streaming
export const streamStorageStats = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  // Send current stats immediately upon connecting
  try {
    const initialStats = cachedStats && (Date.now() - lastCalculated < 15000)
      ? cachedStats
      : await calculateStorageStats();
    res.write(`data: ${JSON.stringify(initialStats)}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  // Listener for realtime change updates
  const onStorageUpdate = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload.data)}\n\n`);
    } catch (writeErr) {
      console.error('SSE write error:', writeErr.message);
    }
  };

  storageEvents.on('storage_update', onStorageUpdate);

  // Send periodic ping to prevent firewall/proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    storageEvents.off('storage_update', onStorageUpdate);
  });
};
