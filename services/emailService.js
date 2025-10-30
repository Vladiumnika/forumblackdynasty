import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Создаем транспортер для отправки email (с поддержкой Ethereal в dev)
const createTransporter = async () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  console.warn('⚠️ EMAIL_* env not set. Using Ethereal test SMTP credentials');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
};

// Функция для отправки email верификации
export const sendVerificationEmail = async (email, username, verificationToken) => {
  try {
    const transporter = await createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify.html?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Подтверждение регистрации - Black Dynasty Forum',
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение регистрации</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #0f0f23, #1a1a2e);
              color: #f8fafc;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              padding: 2rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
            .header {
              text-align: center;
              margin-bottom: 2rem;
            }
            .logo {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              margin: 0 auto 1rem;
              display: block;
              border: 2px solid rgba(99, 102, 241, 0.3);
            }
            h1 {
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-size: 2rem;
              margin: 0;
            }
            .content {
              margin-bottom: 2rem;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              color: white;
              padding: 1rem 2rem;
              border-radius: 0.75rem;
              text-decoration: none;
              font-weight: 600;
              text-align: center;
              margin: 1rem 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .footer {
              text-align: center;
              margin-top: 2rem;
              padding-top: 2rem;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              color: #cbd5e1;
              font-size: 0.875rem;
            }
            .warning {
              background: rgba(245, 158, 11, 0.1);
              border: 1px solid rgba(245, 158, 11, 0.3);
              border-radius: 0.5rem;
              padding: 1rem;
              margin: 1rem 0;
              color: #f59e0b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://scontent.fsof9-1.fna.fbcdn.net/v/t39.30808-6/571988370_841740614988641_4931287812958960179_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_ohc=JSd4-ITOjgcQ7kNvwFOqkQ7&_nc_oc=Adm_e5aA5WU9eof9veIHiA52McHekVzSnblE7bv-L7OFklS5WjRcvem54mQAd-KT28U&_nc_zt=23&_nc_ht=scontent.fsof9-1.fna&_nc_gid=GAzQPtc-5TrDnaGzgUezNQ&oh=00_AfcVmM5L42RcWnUER1_2J0zgV8vq1e5XdjZmY-k6kEZ6JA&oe=6901C55E" alt="Black Dynasty Logo" class="logo">
              <h1>Добро пожаловать в Black Dynasty!</h1>
            </div>
            
            <div class="content">
              <p>Привет, <strong>${username}</strong>!</p>
              
              <p>Спасибо за регистрацию на форуме Black Dynasty. Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш email адрес.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Подтвердить Email</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Важно:</strong> Ссылка действительна в течение 24 часов. Если вы не подтвердите email в течение этого времени, вам потребуется зарегистрироваться заново.
              </div>
              
              <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в ваш браузер:</p>
              <p style="word-break: break-all; background: rgba(255, 255, 255, 0.1); padding: 0.5rem; border-radius: 0.5rem; font-family: monospace;">${verificationUrl}</p>
            </div>
            
            <div class="footer">
              <p>С уважением,<br>Команда Black Dynasty Forum</p>
              <p>Если вы не регистрировались на нашем форуме, просто проигнорируйте это письмо.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(result) : undefined;
    console.log('✅ Email верификации отправлен:', result.messageId, previewUrl ? `\nPreview: ${previewUrl}` : '');
    return { success: true, messageId: result.messageId, previewUrl };
    
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    return { success: false, error: error.message };
  }
};

// Функция для отправки email приветствия после верификации
export const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Добро пожаловать в Black Dynasty Forum!',
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Добро пожаловать!</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #0f0f23, #1a1a2e);
              color: #f8fafc;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              padding: 2rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
            .header {
              text-align: center;
              margin-bottom: 2rem;
            }
            .logo {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              margin: 0 auto 1rem;
              display: block;
              border: 2px solid rgba(16, 185, 129, 0.3);
            }
            h1 {
              background: linear-gradient(135deg, #10b981, #059669);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-size: 2rem;
              margin: 0;
            }
            .success {
              background: rgba(16, 185, 129, 0.1);
              border: 1px solid rgba(16, 185, 129, 0.3);
              border-radius: 0.5rem;
              padding: 1rem;
              margin: 1rem 0;
              color: #10b981;
              text-align: center;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              color: white;
              padding: 1rem 2rem;
              border-radius: 0.75rem;
              text-decoration: none;
              font-weight: 600;
              text-align: center;
              margin: 1rem 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .footer {
              text-align: center;
              margin-top: 2rem;
              padding-top: 2rem;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              color: #cbd5e1;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://scontent.fsof9-1.fna.fbcdn.net/v/t39.30808-6/571988370_841740614988641_4931287812958960179_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_ohc=JSd4-ITOjgcQ7kNvwFOqkQ7&_nc_oc=Adm_e5aA5WU9eof9veIHiA52McHekVzSnblE7bv-L7OFklS5WjRcvem54mQAd-KT28U&_nc_zt=23&_nc_ht=scontent.fsof9-1.fna&_nc_gid=GAzQPtc-5TrDnaGzgUezNQ&oh=00_AfcVmM5L42RcWnUER1_2J0zgV8vq1e5XdjZmY-k6kEZ6JA&oe=6901C55E" alt="Black Dynasty Logo" class="logo">
              <h1>Добро пожаловать!</h1>
            </div>
            
            <div class="success">
              <strong>🎉 Поздравляем!</strong><br>
              Ваш аккаунт успешно подтвержден!
            </div>
            
            <p>Привет, <strong>${username}</strong>!</p>
            
            <p>Теперь вы можете пользоваться всеми возможностями форума Black Dynasty:</p>
            <ul>
              <li>Создавать и участвовать в обсуждениях</li>
              <li>Общаться с другими игроками</li>
              <li>Получать помощь и делиться опытом</li>
              <li>Быть в курсе последних новостей</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}" class="button">Перейти на форум</a>
            </div>
            
            <div class="footer">
              <p>С уважением,<br>Команда Black Dynasty Forum</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(result) : undefined;
    console.log('✅ Приветственный email отправлен:', result.messageId, previewUrl ? `\nPreview: ${previewUrl}` : '');
    return { success: true, messageId: result.messageId, previewUrl };
    
  } catch (error) {
    console.error('❌ Ошибка отправки приветственного email:', error);
    return { success: false, error: error.message };
  }
};

// Письмо для сброса пароля
export const sendPasswordResetEmail = async (email, username, resetToken) => {
  try {
    const transporter = await createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset.html?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Сброс пароля - Black Dynasty Forum',
      html: `
        <div style="font-family: Inter, sans-serif; background:#0f0f23; color:#f8fafc; padding:24px">
          <h2 style="background:linear-gradient(135deg,#6366f1,#4f46e5); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin:0 0 12px">Сброс пароля</h2>
          <p>Здравствуйте, <strong>${username}</strong>!</p>
          <p>Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы установить новый пароль.</p>
          <p><a href="${resetUrl}" style="display:inline-block; background:linear-gradient(135deg,#6366f1,#4f46e5); padding:12px 20px; color:#fff; border-radius:8px; text-decoration:none">Сбросить пароль</a></p>
          <p style="color:#cbd5e1">Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(result) : undefined;
    console.log('✅ Письмо для сброса пароля отправлено:', result.messageId, previewUrl ? `\nPreview: ${previewUrl}` : '');
    return { success: true, messageId: result.messageId, previewUrl };
  } catch (error) {
    console.error('❌ Ошибка отправки письма сброса:', error);
    return { success: false, error: error.message };
  }
};