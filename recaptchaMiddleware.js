import fetch from 'node-fetch';

export const verifyRecaptcha = async (req, res, next) => {
  try {
    const token = req.body.recaptchaToken;
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'reCAPTCHA обязательна! Пожалуйста, пройдите проверку.' 
      });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret || process.env.RECAPTCHA_BYPASS === 'true' || process.env.NODE_ENV === 'development') {
      console.warn('⚠️ reCAPTCHA verification bypassed (dev mode or missing secret).');
      return next();
    }

    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });

    const data = await response.json();
    
    if (!data.success) {
      console.log('reCAPTCHA verification failed:', data);
      return res.status(400).json({ 
        success: false,
        message: 'reCAPTCHA не пройдена! Пожалуйста, попробуйте снова.' 
      });
    }

    console.log('reCAPTCHA verification successful');
    next();
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ошибка проверки reCAPTCHA. Попробуйте позже.' 
    });
  }
};
