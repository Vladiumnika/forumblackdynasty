import express from "express";
import {
  getCategories,
  getTopics,
  getComments,
  createTopic,
  createComment,
  getTopicById,
  updateTopic,
  deleteTopic,
  updateComment,
  deleteComment,
  likeComment,
  createCategory,
  updateCategory,
  deleteCategory,
  search,
  subscribeTopic,
  unsubscribeTopic,
  bookmarkTopic,
  unbookmarkTopic
} from "../controllers/forumController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Получить категории
router.get("/categories", getCategories);
router.post("/categories", authMiddleware, roleMiddleware(["admin", "moderator"]), createCategory);
router.put("/categories/:categoryId", authMiddleware, roleMiddleware(["admin", "moderator"]), updateCategory);
router.delete("/categories/:categoryId", authMiddleware, roleMiddleware(["admin", "moderator"]), deleteCategory);

// Получить темы категории
router.get("/categories/:categoryId/topics", getTopics);

// Получить тему по id (+увеличить просмотры)
router.get("/topics/:topicId", getTopicById);

// Получить комментарии темы
router.get("/topics/:topicId/comments", getComments);

// Создать тему (только для авторизованных)
router.post("/topics", authMiddleware, createTopic);

// Обновить/удалить тему (автор или модератор)
router.put("/topics/:topicId", authMiddleware, updateTopic);
router.delete("/topics/:topicId", authMiddleware, deleteTopic);

// Создать комментарий (только для авторизованных)
router.post("/comments", authMiddleware, createComment);

// Обновить/удалить комментарий (автор или модератор)
router.put("/comments/:commentId", authMiddleware, updateComment);
router.delete("/comments/:commentId", authMiddleware, deleteComment);

// Лайк комментария
router.post("/comments/:commentId/like", authMiddleware, likeComment);

// Поиск по темам
router.get("/search", search);

// Подписки и закладки
router.post("/topics/:topicId/subscribe", authMiddleware, subscribeTopic);
router.post("/topics/:topicId/unsubscribe", authMiddleware, unsubscribeTopic);
router.post("/topics/:topicId/bookmark", authMiddleware, bookmarkTopic);
router.post("/topics/:topicId/unbookmark", authMiddleware, unbookmarkTopic);

export default router;
