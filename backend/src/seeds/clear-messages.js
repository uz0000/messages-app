import "dotenv/config";

import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import Message from "../models/message.model.js";

async function clearMessages() {
  await connectDB();

  const result = await Message.deleteMany({});

  console.log(`Deleted ${result.deletedCount} message(s).`);
}

clearMessages()
  .catch((error) => {
    console.error("Failed to clear messages:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
