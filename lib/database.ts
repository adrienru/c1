import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Crear directorio de base de datos si no existe
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'password_manager.db');
const db = new Database(dbPath);

// Inicializar tablas
const initTables = () => {
  // Tabla de usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de contraseñas
  db.exec(`
    CREATE TABLE IF NOT EXISTS passwords (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      service_name TEXT NOT NULL,
      username TEXT NOT NULL,
      encrypted_password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de claves 2FA
  db.exec(`
    CREATE TABLE IF NOT EXISTS two_factor_auth_keys (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      service_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      encrypted_secret TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
    CREATE INDEX IF NOT EXISTS idx_two_factor_auth_keys_user_id ON two_factor_auth_keys(user_id);
  `);
};

// Inicializar base de datos
initTables();

export { db };