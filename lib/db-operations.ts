import "server-only";
import { db } from './database';

// Operaciones de usuarios
export const userOperations = {
  create: (email: string, username: string, hashedPassword: string) => {
    const stmt = db.prepare(`
      INSERT INTO users (email, username, hashed_password)
      VALUES (?, ?, ?)
    `);
    return stmt.run(email, username, hashedPassword);
  },

  findByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findByUsername: (username: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },

  findById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }
};

// Operaciones de contraseñas
export const passwordOperations = {
  create: (userId: string, serviceName: string, username: string, encryptedPassword: string) => {
    const stmt = db.prepare(`
      INSERT INTO passwords (user_id, service_name, username, encrypted_password)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(userId, serviceName, username, encryptedPassword);
  },

  findByUserId: (userId: string) => {
    const stmt = db.prepare(`
      SELECT id, service_name, username, created_at, encrypted_password
      FROM passwords
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  },

  findById: (id: string, userId: string) => {
    const stmt = db.prepare(`
      SELECT encrypted_password
      FROM passwords
      WHERE id = ? AND user_id = ?
    `);
    return stmt.get(id, userId);
  },

  delete: (id: string, userId: string) => {
    const stmt = db.prepare('DELETE FROM passwords WHERE id = ? AND user_id = ?');
    return stmt.run(id, userId);
  }
};

// Operaciones de claves 2FA
export const twoFactorOperations = {
  create: (userId: string, serviceName: string, accountName: string, encryptedSecret: string) => {
    const stmt = db.prepare(`
      INSERT INTO two_factor_auth_keys (user_id, service_name, account_name, encrypted_secret)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(userId, serviceName, accountName, encryptedSecret);
  },

  findByUserId: (userId: string) => {
    const stmt = db.prepare(`
      SELECT id, service_name, account_name, created_at, encrypted_secret
      FROM two_factor_auth_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  },

  findById: (id: string, userId: string) => {
    const stmt = db.prepare(`
      SELECT encrypted_secret
      FROM two_factor_auth_keys
      WHERE id = ? AND user_id = ?
    `);
    return stmt.get(id, userId);
  },

  delete: (id: string, userId: string) => {
    const stmt = db.prepare('DELETE FROM two_factor_auth_keys WHERE id = ? AND user_id = ?');
    return stmt.run(id, userId);
  }
}