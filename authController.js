import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
import crypto from 'crypto';

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Все поля обязательны!' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Пользователь с таким email уже существует!' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Генерируем токен верификации
    const verificationToken = newUser.generateEmailVerificationToken();
    await newUser.save();

    // Отправляем email верификации
    const emailResult = await sendVerificationEmail(email, username, verificationToken);

    // Даже если письмо не отправилось, не удаляем пользователя; позволяем повторить отправку
    res.status(201).json({ 
      success: true,
      message: emailResult.success 
        ? 'Аккаунт создан! Проверьте ваш email для подтверждения регистрации.'
        : 'Аккаунт создан. Отправка письма не удалась, попробуйте повторную отправку.',
      previewUrl: emailResult.previewUrl
    });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка сервера. Попробуйте позже.' 
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Неверный email или пароль!' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Неверный email или пароль!' 
      });
    }

    // Проверяем верификацию email
    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Пожалуйста, подтвердите ваш email перед входом в систему!' 
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        isEmailVerified: user.isEmailVerified
      } 
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка сервера. Попробуйте позже.' 
    });
  }
};

// Подтверждение email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Токен верификации не предоставлен!' 
      });
    }

    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Недействительный или истекший токен верификации!' 
      });
    }

    // Подтверждаем email
    const isVerified = user.verifyEmail(token);
    if (!isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Ошибка верификации токена!' 
      });
    }

    await user.save();

    // Отправляем приветственный email
    await sendWelcomeEmail(user.email, user.username);

    res.json({ 
      success: true,
      message: 'Email успешно подтвержден! Добро пожаловать в Black Dynasty!' 
    });

  } catch (err) {
    console.error('Ошибка верификации email:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка сервера. Попробуйте позже.' 
    });
  }
};

// Повторная отправка email верификации
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email обязателен!' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Пользователь с таким email не найден!' 
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Email уже подтвержден!' 
      });
    }

    // Генерируем новый токен
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Отправляем email
    const emailResult = await sendVerificationEmail(email, user.username, verificationToken);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false,
        message: 'Ошибка отправки email. Попробуйте позже.' 
      });
    }

    res.json({ 
      success: true,
      message: 'Email верификации отправлен повторно!' 
    });

  } catch (err) {
    console.error('Ошибка повторной отправки email:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка сервера. Попробуйте позже.' 
    });
  }
};

// Запрос на сброс пароля (отправка письма)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email обязателен!' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ success: true, message: 'Если email существует, письмо отправлено.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 час
    await user.save();

    await sendPasswordResetEmail(user.email, user.username, token);
    res.json({ success: true, message: 'Если email существует, письмо отправлено.' });
  } catch (err) {
    console.error('Ошибка запроса сброса пароля:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера. Попробуйте позже.' });
  }
};

// Сброс пароля
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Не все поля заполнены' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Недействительный или истекший токен' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Пароль обновлен. Теперь можно войти.' });
  } catch (err) {
    console.error('Ошибка сброса пароля:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера. Попробуйте позже.' });
  }
};
