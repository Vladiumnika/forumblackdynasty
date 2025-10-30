import Category from "../models/Category.js";
import Topic from "../models/Topic.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

// Получить все категории
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Ошибка при получении категорий" });
  }
};

// Получить все темы по категории
export const getTopics = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const filter = { category: req.params.categoryId };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Topic.find(filter)
        .sort({ isPinned: -1, lastCommentAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("author", "username"),
      Topic.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), pageSize: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при получении тем" });
  }
};

// Создать категорию (admin/moderator)
export const createCategory = async (req, res) => {
  try {
    const { name, description, order } = req.body;
    if (!name) return res.status(400).json({ message: "Название обязательно" });
    const category = await Category.create({ name, description: description || "", order: order ?? 0 });
    res.status(201).json({ message: "Категория создана", category });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при создании категории" });
  }
};

// Обновить категорию (admin/moderator)
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, order } = req.body;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Категория не найдена" });
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (order !== undefined) category.order = order;
    await category.save();
    res.json({ message: "Категория обновлена", category });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при обновлении категории" });
  }
};

// Удалить категорию (admin/moderator)
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Категория не найдена" });
    const topics = await Topic.find({ category: category._id });
    const topicIds = topics.map(t => t._id);
    await Comment.deleteMany({ topic: { $in: topicIds } });
    await Topic.deleteMany({ category: category._id });
    await category.deleteOne();
    res.json({ message: "Категория удалена" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при удалении категории" });
  }
};

// Глобальный поиск по темам
export const search = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    const filter = q ? { $or: [ { title: { $regex: q, $options: 'i' } }, { content: { $regex: q, $options: 'i' } } ] } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Topic.find(filter)
        .sort({ isPinned: -1, lastCommentAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'username')
        .populate('category', 'name'),
      Topic.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), pageSize: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при поиске" });
  }
};

// Получить все комментарии по теме
export const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Comment.find({ topic: req.params.topicId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("author", "username"),
      Comment.countDocuments({ topic: req.params.topicId })
    ]);
    res.json({ items, total, page: Number(page), pageSize: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при получении комментариев" });
  }
};

// Создать новую тему
export const createTopic = async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: "Не все поля заполнены" });
    }
    const topic = new Topic({ title, content, category: categoryId, author: req.user.id });
    await topic.save();
    res.json({ message: "Тема создана", topic });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при создании темы" });
  }
};

// Создать новый комментарий
export const createComment = async (req, res) => {
  try {
    const { content, topicId, parentId } = req.body;
    if (!content || !topicId) {
      return res.status(400).json({ message: "Не все поля заполнены" });
    }
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: "Тема не найдена" });
    if (topic.isLocked) return res.status(403).json({ message: "Тема закрыта" });

    const comment = new Comment({ content, topic: topicId, author: req.user.id, parent: parentId || null });
    await comment.save();

    topic.repliesCount = (topic.repliesCount || 0) + 1;
    topic.lastCommentAt = comment.createdAt;
    topic.lastCommentBy = req.user.id;
    await topic.save();

    res.json({ message: "Комментарий добавлен", comment });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при добавлении комментария" });
  }
};

// Получить тему по id и увеличить просмотры
export const getTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "username");
    if (!topic) return res.status(404).json({ message: "Тема не найдена" });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: "Ошибка при получении темы" });
  }
};

// Обновить тему (автор или модератор)
export const updateTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, content, isLocked, isPinned } = req.body;
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: "Тема не найдена" });

    const isOwner = String(topic.author) === String(req.user.id);
    const isModerator = ["admin", "moderator"].includes(req.user.role);
    if (!isOwner && !isModerator) return res.status(403).json({ message: "Нет прав" });

    if (title !== undefined) topic.title = title;
    if (content !== undefined) topic.content = content;
    if (isLocked !== undefined && isModerator) topic.isLocked = !!isLocked;
    if (isPinned !== undefined && isModerator) topic.isPinned = !!isPinned;
    await topic.save();
    res.json({ message: "Тема обновлена", topic });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при обновлении темы" });
  }
};

// Удалить тему (автор или модератор)
export const deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: "Тема не найдена" });

    const isOwner = String(topic.author) === String(req.user.id);
    const isModerator = ["admin", "moderator"].includes(req.user.role);
    if (!isOwner && !isModerator) return res.status(403).json({ message: "Нет прав" });

    await Comment.deleteMany({ topic: topic._id });
    await topic.deleteOne();
    res.json({ message: "Тема удалена" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при удалении темы" });
  }
};

// Обновить комментарий (автор или модератор)
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Комментарий не найден" });

    const isOwner = String(comment.author) === String(req.user.id);
    const isModerator = ["admin", "moderator"].includes(req.user.role);
    if (!isOwner && !isModerator) return res.status(403).json({ message: "Нет прав" });

    if (content !== undefined) comment.content = content;
    comment.editedAt = new Date();
    await comment.save();
    res.json({ message: "Комментарий обновлен", comment });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при обновлении комментария" });
  }
};

// Удалить комментарий (автор или модератор)
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Комментарий не найден" });

    const isOwner = String(comment.author) === String(req.user.id);
    const isModerator = ["admin", "moderator"].includes(req.user.role);
    if (!isOwner && !isModerator) return res.status(403).json({ message: "Нет прав" });

    await comment.deleteOne();

    // уменьшить счетчик ответов темы
    await Topic.findByIdAndUpdate(comment.topic, { $inc: { repliesCount: -1 } });

    res.json({ message: "Комментарий удален" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при удалении комментария" });
  }
};

// Лайк комментария
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const updated = await Comment.findByIdAndUpdate(commentId, { $inc: { likes: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: "Комментарий не найден" });
    res.json({ message: "Лайк добавлен", comment: updated });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при добавлении лайка" });
  }
};

// Подписка на тему
export const subscribeTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { subscribedTopicIds: topicId } });
    res.json({ message: "Подписка оформлена" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка подписки" });
  }
};

export const unsubscribeTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    await User.findByIdAndUpdate(req.user.id, { $pull: { subscribedTopicIds: topicId } });
    res.json({ message: "Подписка отменена" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка отмены подписки" });
  }
};

// Закладки темы
export const bookmarkTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { bookmarkedTopicIds: topicId } });
    res.json({ message: "Добавлено в закладки" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка добавления в закладки" });
  }
};

export const unbookmarkTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    await User.findByIdAndUpdate(req.user.id, { $pull: { bookmarkedTopicIds: topicId } });
    res.json({ message: "Удалено из закладок" });
  } catch (err) {
    res.status(500).json({ message: "Ошибка удаления из закладок" });
  }
};
