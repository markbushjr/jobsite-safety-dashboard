import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
