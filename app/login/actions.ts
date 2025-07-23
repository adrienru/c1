"use server"

import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"
import { createSession } from "@/lib/session"

export async function signup(email: string, username: string, password: string) {
  if (!email || !username || !password) {
    return { success: false, error: "Email, nombre de usuario y contraseña son requeridos." }
  }

  // Verificar si el email ya existe
  const { data: existingEmailUser } = await supabase.from("users").select("id").eq("email", email).single()
  if (existingEmailUser) {
    return { success: false, error: "El usuario con este correo ya existe." }
  }

  // Verificar si el nombre de usuario ya existe
  const { data: existingUsernameUser } = await supabase.from("users").select("id").eq("username", username).single()
  if (existingUsernameUser) {
    return { success: false, error: "El nombre de usuario ya está en uso." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from("users")
    .insert({ email, username, hashed_password: hashedPassword }) // Incluye el nombre de usuario
    .select("id")
    .single()

  if (error) {
    console.error("Error al registrar usuario:", error)
    return { success: false, error: error.message || "Error al registrar usuario." }
  }

  await createSession(data.id)
  return { success: true }
}

export async function login(identifier: string, password: string) {
  if (!identifier || !password) {
    return { success: false, error: "Correo/Usuario y contraseña son requeridos." }
  }

  let user = null
  let error = null

  // Intentar buscar por email
  if (identifier.includes("@")) {
    const { data, error: emailError } = await supabase.from("users").select("*").eq("email", identifier).single()
    user = data
    error = emailError
  }

  // Si no se encontró por email o no era un email, intentar buscar por username
  if (!user) {
    const { data, error: usernameError } = await supabase.from("users").select("*").eq("username", identifier).single()
    user = data
    error = usernameError
  }

  if (error || !user) {
    return { success: false, error: "Credenciales inválidas." }
  }

  const passwordMatch = await bcrypt.compare(password, user.hashed_password)

  if (!passwordMatch) {
    return { success: false, error: "Credenciales inválidas." }
  }

  await createSession(user.id)
  return { success: true }
}
