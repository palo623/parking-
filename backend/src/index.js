import app from './app.js';

// Servidor local (npm run backend). En Vercel se usa api/index.js
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API del parking en http://localhost:${PORT}`));
