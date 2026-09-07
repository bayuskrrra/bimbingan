import app from './app.js';
import { PORT } from './config.js';

app.listen(PORT, () => {
  console.log(`[SERVER] Sistem BK Backend running on http://localhost:${PORT}`);
});
