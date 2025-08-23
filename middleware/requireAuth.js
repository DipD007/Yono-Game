const requireAuth = (password) => (req, res, next) => {
    const providedPassword = req.body.password;

    if (!providedPassword) {
        return res.status(401).json({ error: 'Password is required for this action.' });
    }

    if (providedPassword === password) {
        // Password is correct, proceed to the next middleware or route handler
        next();
    } else {
        // Password is incorrect, send an unauthorized error
        res.status(401).json({ error: 'Invalid password.' });
    }
};

module.exports = requireAuth;
