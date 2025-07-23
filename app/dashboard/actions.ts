"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "@/lib/supabase"
import { encryptPassword, decryptPassword } from "@/lib/encryption"
import { deleteSession, getUserIdFromSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { authenticator } from "otplib" // Importa otplib

export async function addPassword(serviceName: string, username: string, passwordPlain: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  if (!serviceName || !username || !passwordPlain) {
    return { success: false, error: "Todos los campos son requeridos." }
  }

  const encryptedPassword = encryptPassword(passwordPlain)

  const { error } = await supabase.from("passwords").insert({
    user_id: userId,
    service_name: serviceName,
    username: username,
    encrypted_password: encryptedPassword,
  })

  if (error) {
    console.error("Error al añadir contraseña:", error)
    return { success: false, error: error.message || "Error al añadir contraseña." }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getPasswords(userId: string) {
  const { data, error } = await supabase
    .from("passwords")
    .select("id, service_name, username, created_at, encrypted_password")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al obtener contraseñas:", error)
    return []
  }

  return data
}

export async function deletePassword(passwordId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  const { error } = await supabase.from("passwords").delete().eq("id", passwordId).eq("user_id", userId)

  if (error) {
    console.error("Error al eliminar contraseña:", error)
    return { success: false, error: error.message || "Error al eliminar contraseña." }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getDecryptedPassword(passwordId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  const { data: passwordEntry, error } = await supabase
    .from("passwords")
    .select("encrypted_password")
    .eq("id", passwordId)
    .eq("user_id", userId)
    .single()

  if (error || !passwordEntry) {
    console.error("Error al obtener contraseña cifrada:", error)
    return { success: false, error: error.message || "Contraseña no encontrada o no autorizada." }
  }

  try {
    const decrypted = decryptPassword(passwordEntry.encrypted_password)
    return { success: true, password: decrypted }
  } catch (decryptError) {
    console.error("Error al descifrar contraseña:", decryptError)
    return { success: false, error: "Error al descifrar la contraseña." }
  }
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}

export async function getSecurityAuditResults() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  const { data: passwords, error } = await supabase
    .from("passwords")
    .select("encrypted_password, created_at")
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching passwords for audit:", error)
    return { success: false, error: error.message || "Error al obtener contraseñas para auditoría." }
  }

  let weakCount = 0
  let reusedCount = 0
  let oldCount = 0
  const decryptedPasswords: string[] = []
  const passwordOccurrences = new Map<string, number>()

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  for (const p of passwords) {
    try {
      const decrypted = decryptPassword(p.encrypted_password)
      decryptedPasswords.push(decrypted)

      const hasUppercase = /[A-Z]/.test(decrypted)
      const hasLowercase = /[a-z]/.test(decrypted)
      const hasNumber = /[0-9]/.test(decrypted)
      const hasSymbol = /[!@#$%^&*()-_=+]/.test(decrypted)

      if (decrypted.length < 12 || !(hasUppercase && hasLowercase && hasNumber && hasSymbol)) {
        weakCount++
      }

      const createdAtDate = new Date(p.created_at)
      if (createdAtDate < oneYearAgo) {
        oldCount++
      }

      passwordOccurrences.set(decrypted, (passwordOccurrences.get(decrypted) || 0) + 1)
    } catch (e) {
      console.error("Error decrypting password during audit:", e)
    }
  }

  passwordOccurrences.forEach((count) => {
    if (count > 1) {
      reusedCount += count - 1
    }
  })

  let score = 100
  score -= weakCount * 5
  score -= reusedCount * 10
  score -= oldCount * 3

  score = Math.max(0, score)

  return {
    success: true,
    score,
    weakCount,
    reusedCount,
    oldCount,
    totalPasswords: passwords.length,
  }
}

// --- Acciones para el Gestor de Llaves 2FA ---

export async function addTwoFactorAuthKey(serviceName: string, accountName: string, secretKeyPlain: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  if (!serviceName || !accountName || !secretKeyPlain) {
    return { success: false, error: "Todos los campos son requeridos." }
  }

  try {
    // Cifrar la clave secreta antes de guardarla
    const encryptedSecret = encryptPassword(secretKeyPlain)

    const { error } = await supabase.from("two_factor_auth_keys").insert({
      user_id: userId,
      service_name: serviceName,
      account_name: accountName,
      encrypted_secret: encryptedSecret,
    })

    if (error) {
      console.error("Error al añadir clave 2FA:", error)
      return { success: false, error: error.message || "Error al añadir clave 2FA." }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (e: any) {
    console.error("Error de cifrado al añadir clave 2FA:", e)
    return { success: false, error: e.message || "Error de cifrado." }
  }
}

export async function getTwoFactorAuthKeys() {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  const { data, error } = await supabase
    .from("two_factor_auth_keys")
    .select("id, service_name, account_name, created_at, encrypted_secret")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al obtener claves 2FA:", error)
    return { success: false, error: error.message || "Error al obtener claves 2FA." }
  }

  return { success: true, data }
}

export async function deleteTwoFactorAuthKey(keyId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  const { error } = await supabase.from("two_factor_auth_keys").delete().eq("id", keyId).eq("user_id", userId)

  if (error) {
    console.error("Error al eliminar clave 2FA:", error)
    return { success: false, error: error.message || "Error al eliminar clave 2FA." }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function generateTotpCode(keyId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  const { data: keyEntry, error } = await supabase
    .from("two_factor_auth_keys")
    .select("encrypted_secret")
    .eq("id", keyId)
    .eq("user_id", userId)
    .single()

  if (error || !keyEntry) {
    console.error("Error al obtener clave secreta 2FA cifrada:", error)
    return { success: false, error: error.message || "Clave 2FA no encontrada o no autorizada." }
  }

  try {
    const decryptedSecret = decryptPassword(keyEntry.encrypted_secret)
    // Generar el código TOTP
    const token = authenticator.generate(decryptedSecret)
    return { success: true, token }
  } catch (e: any) {
    console.error("Error al generar código TOTP:", e)
    return { success: false, error: e.message || "Error al generar código TOTP." }
  }
}
