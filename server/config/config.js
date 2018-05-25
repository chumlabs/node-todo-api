const dotenv = require('dotenv');

// env
const envMode = process.env.NODE_ENV || 'development';
const path = `.env.${envMode}`;
dotenv.config({ path, silent: envMode === 'production' });
console.log(process.env);
