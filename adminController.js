import User from '../models/User.js';

// List users (simple filter by email or username contains q)
export const listUsers = async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query;
    const filter = q ? { $or: [{ email: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }] } : {};
    const users = await User.find(filter).select('username email role createdAt').limit(Number(limit));
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения списка пользователей' });
  }
};

// Set user role (admin only)
export const setUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('username email role');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ message: 'Роль обновлена', user });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка обновления роли' });
  }
};


