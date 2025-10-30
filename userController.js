import User from '../models/User.js';

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email role avatarUrl bio createdAt updatedAt');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения профиля' });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { avatarUrl, bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    await user.save();
    res.json({ message: 'Профиль обновлен', user: { username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl, bio: user.bio } });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
};


