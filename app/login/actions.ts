"use server"

import bcrypt from "bcryptjs"
import { userOperations } from "@/lib/db-operations"
import { createSession } from "@/lib/session"

export async function signup(email: string, username: string, password: string) {
  if (!email || !username || !password) {
    return { success: false, error: "Email, nombre de usuario y contraseña son requeridos." }
  }

  // Verificar si el email ya existe
  const existingEmailUser = userOperations.findByEmail(email)
  if (existingEmailUser) {
    return { success: false, error: "El usuario con este correo ya existe." }
  }

  // Verificar si el nombre de usuario ya existe
  const existingUsernameUser = userOperations.findByUsername(username)
  if (existingUsernameUser) {
    return { success: false, error: "El nombre de usuario ya está en uso." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const result = userOperations.create(email, username, hashedPassword)
    const newUser = userOperations.findByEmail(email)
    
    if (!newUser) {
      return { success: false, error: "Error al crear usuario." }
    }

    await createSession(newUser.id)
    return { success: true }
  } catch (error: any) {
    console.error("Error al registrar usuario:", error)
    return { success: false, error: error.message || "Error al registrar usuario." }
  }
}

export async function login(identifier: string, password: string) {
  if (!identifier || !password) {
    return { success: false, error: "Correo/Usuario y contraseña son requeridos." }
  }

  let user = null

  // Intentar buscar por email
  if (identifier.includes("@")) {
    user = userOperations.findByEmail(identifier)
  }

  // Si no se encontró por email o no era un email, intentar buscar por username
  if (!user) {
    user = userOperations.findByUsername(identifier)
  }

  if (!user) {
    return { success: false, error: "Credenciales inválidas." }
  }

  const passwordMatch = await bcrypt.compare(password, user.hashed_password)

  if (!passwordMatch) {
    return { success: false, error: "Credenciales inválidas." }
  }

  await createSession(user.id)
  return { success: true }
}
