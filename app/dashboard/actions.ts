"use server"

import { revalidatePath } from "next/cache"
import { passwordOperations, twoFactorOperations } from "@/lib/db-operations"
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

  try {
    const encryptedPassword = encryptPassword(passwordPlain)
    passwordOperations.create(userId, serviceName, username, encryptedPassword)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error al añadir contraseña:", error)
    return { success: false, error: error.message || "Error al añadir contraseña." }
  }
}

export async function getPasswords(userId: string) {
  try {
    return passwordOperations.findByUserId(userId)
  } catch (error) {
    console.error("Error al obtener contraseñas:", error)
    return []
  }
}

export async function deletePassword(passwordId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  try {
    passwordOperations.delete(passwordId, userId)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error al eliminar contraseña:", error)
    return { success: false, error: error.message || "Error al eliminar contraseña." }
  }
}

export async function getDecryptedPassword(passwordId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  try {
    const passwordEntry = passwordOperations.findById(passwordId, userId)
    
    if (!passwordEntry) {
      return { success: false, error: "Contraseña no encontrada o no autorizada." }
    }

    const decrypted = decryptPassword(passwordEntry.encrypted_password)
    return { success: true, password: decrypted }
  } catch (decryptError: any) {
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

  try {
    const passwords = passwordOperations.findByUserId(userId)
    
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
  } catch (error: any) {
    console.error("Error fetching passwords for audit:", error)
    return { success: false, error: error.message || "Error al obtener contraseñas para auditoría." }
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

    twoFactorOperations.create(userId, serviceName, accountName, encryptedSecret)

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

  try {
    const data = twoFactorOperations.findByUserId(userId)
    return { success: true, data }
  } catch (error: any) {
    console.error("Error al obtener claves 2FA:", error)
    return { success: false, error: error.message || "Error al obtener claves 2FA." }
  }
}

export async function deleteTwoFactorAuthKey(keyId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  try {
    twoFactorOperations.delete(keyId, userId)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error al eliminar clave 2FA:", error)
    return { success: false, error: error.message || "Error al eliminar clave 2FA." }
  }
}

export async function generateTotpCode(keyId: string) {
  const userId = await getUserIdFromSession()
  if (!userId) {
    return { success: false, error: "No autenticado." }
  }

  try {
    const keyEntry = twoFactorOperations.findById(keyId, userId)
    
    if (!keyEntry) {
      return { success: false, error: "Clave 2FA no encontrada o no autorizada." }
    }

    const decryptedSecret = decryptPassword(keyEntry.encrypted_secret)
    // Generar el código TOTP
    const token = authenticator.generate(decryptedSecret)
    return { success: true, token }
  } catch (e: any) {
    console.error("Error al generar código TOTP:", e)
    return { success: false, error: e.message || "Error al generar código TOTP." }
  }
}
