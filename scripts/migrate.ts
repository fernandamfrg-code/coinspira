import { migrate } from '../src/lib/db';
void migrate().then(() => console.log('Base PostgreSQL inicializada.')).catch(error => { console.error(error.message); process.exitCode = 1; });
