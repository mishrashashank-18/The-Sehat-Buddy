import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Use memory server if dummy URI is detected
    if (!uri || uri.includes('<username>:<password>')) {
      console.log('Dummy MongoDB URI detected. Spinning up in-memory MongoDB instance for development...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
