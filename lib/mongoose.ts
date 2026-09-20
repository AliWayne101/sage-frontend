import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_ACCESS as string;

if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_ACCESS in environment variables");
}

/**
 * Global cache (prevents multiple connections in dev + serverless)
 */
let cached = global.mongoose as {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        }).then((mongooseInstance) => {
            return mongooseInstance;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}