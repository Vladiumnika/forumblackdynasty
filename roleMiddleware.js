// Права по роли
export const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Нет авторизации!' });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Нет доступа для вашей роли!' });
    }

    next();
  };
};
