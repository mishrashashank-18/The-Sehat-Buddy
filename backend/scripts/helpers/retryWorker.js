import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processPendingMediaDeletions } from '../../utils/reelCleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const initDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
};

process.on('message', async (msg) => {
  try {
    await initDb();

    if (msg.action === 'processQueue') {
      const workerId = msg.workerId || `worker_${process.pid}_${Date.now()}`;
      const batchSize = msg.batchSize || 10;
      const res = await processPendingMediaDeletions(batchSize, workerId);
      process.send({
        status: 'done',
        workerId,
        result: res
      });
    } else if (msg.action === 'exit') {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.disconnect();
        }
      } catch {}
      process.send({ status: 'exited' });
      setTimeout(() => process.exit(0), 50);
    }
  } catch (err) {
    process.send({ status: 'error', error: err.message });
  }
});
