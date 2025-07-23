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

// Inicializar tablas basadas en init-db.sql
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

  // Tabla de testamentos digitales
  db.exec(`
    CREATE TABLE IF NOT EXISTS digital_wills (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      recipient_email TEXT NOT NULL,
      access_granted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id)
    )
  `);

  // Tabla de contraseñas compartidas
  db.exec(`
    CREATE TABLE IF NOT EXISTS shared_passwords (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      password_id TEXT REFERENCES passwords(id) ON DELETE CASCADE NOT NULL,
      shared_by_user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      shared_with_email TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      view_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de configuración de testamentos digitales
  db.exec(`
    CREATE TABLE IF NOT EXISTS digital_will_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      trusted_contact_email TEXT NOT NULL,
      inactivity_days INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      last_access_granted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de tokens de acceso para testamentos digitales
  db.exec(`
    CREATE TABLE IF NOT EXISTS digital_will_access_tokens (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      trusted_contact_email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
    CREATE INDEX IF NOT EXISTS idx_two_factor_auth_keys_user_id ON two_factor_auth_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_digital_wills_user_id ON digital_wills(user_id);
    CREATE INDEX IF NOT EXISTS idx_shared_passwords_password_id ON shared_passwords(password_id);
    CREATE INDEX IF NOT EXISTS idx_shared_passwords_shared_by_user_id ON shared_passwords(shared_by_user_id);
    CREATE INDEX IF NOT EXISTS idx_digital_will_settings_user_id ON digital_will_settings(user_id);
    CREATE INDEX IF NOT EXISTS idx_digital_will_access_tokens_user_id ON digital_will_access_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_digital_will_access_tokens_token ON digital_will_access_tokens(token);
  `);
};

// Inicializar base de datos
initTables();

export { db };