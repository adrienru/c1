-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL, -- Nueva columna para el nombre de usuario
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contraseñas
CREATE TABLE IF NOT EXISTS passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL, -- Contraseña cifrada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NUEVA TABLA PARA CLAVES 2FA
CREATE TABLE IF NOT EXISTS two_factor_auth_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL, -- La clave secreta TOTP, cifrada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de digital wills
CREATE TABLE IF NOT EXISTS digital_wills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  access_granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id) -- Ensure only one will per user
);

-- Tabla de shared passwords
CREATE TABLE IF NOT EXISTS shared_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  password_id UUID REFERENCES passwords(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  encrypted_key TEXT NOT NULL, -- Key to decrypt the password, encrypted with recipient's public key
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  view_count INT DEFAULT 1, -- Para implementar vista única
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de digital will settings
CREATE TABLE IF NOT EXISTS digital_will_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    trusted_contact_email TEXT NOT NULL,
    inactivity_days INT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    last_access_granted_at TIMESTAMP WITH TIME ZONE, -- Última vez que se otorgó acceso
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de digital will access tokens
CREATE TABLE IF NOT EXISTS digital_will_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    trusted_contact_email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para actualizar last_login en el inicio de sesión del usuario
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar `updated_at` automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para la tabla 'users' para llamar a la función después de un inicio de sesión exitoso
-- Este trigger estaría típicamente asociado con un evento de autenticación, no directamente en la actualización de la tabla de usuarios
-- Para Supabase Auth, usarías un claim personalizado o un webhook para actualizar last_login.
-- Este es un marcador para un sistema de autenticación personalizado.
-- DROP TRIGGER IF EXISTS update_last_login_trigger ON users;
-- CREATE TRIGGER update_last_login_trigger
-- AFTER INSERT OR UPDATE ON users
-- FOR EACH ROW
-- EXECUTE PROCEDURE update_last_login();

-- Trigger para la tabla 'digital_will_settings' para actualizar `updated_at`
DROP TRIGGER IF EXISTS set_timestamp ON digital_will_settings;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON digital_will_settings
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username); -- Nuevo índice para el nombre de usuario
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_keys_user_id ON two_factor_auth_keys(user_id);
