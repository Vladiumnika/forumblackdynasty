import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// Импорт рутове
import authRoutes from "./routes/authRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB подключен"))
  .catch(err => console.log("❌ Ошибка подключения к MongoDB:", err));

// API маршруты
app.use("/api/auth", authRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Статические файлы фронтенда
app.use(express.static("../frontend"));

// Любой другой путь отдаёт index.html
app.use((req, res) => {
  res.sendFile("index.html", { root: "../frontend" });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
