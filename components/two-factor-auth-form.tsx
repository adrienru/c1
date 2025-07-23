"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addTwoFactorAuthKey } from "@/app/dashboard/actions" // Importa la acción

export function TwoFactorAuthForm() {
  const [serviceName, setServiceName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await addTwoFactorAuthKey(serviceName, accountName, secretKey)
      if (result.success) {
        toast({
          title: "Clave 2FA añadida",
          description: "La clave de autenticación de dos factores ha sido guardada exitosamente.",
        })
        setServiceName("")
        setAccountName("")
        setSecretKey("")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo añadir la clave 2FA.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding 2FA key:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al añadir la clave 2FA.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="2fa-serviceName">Nombre del Servicio</Label>
        <Input
          id="2fa-serviceName"
          placeholder="Ej: Google, Discord"
          required
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="2fa-accountName">Nombre de Cuenta/Email</Label>
        <Input
          id="2fa-accountName"
          placeholder="tu_usuario@ejemplo.com"
          required
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="2fa-secretKey">Clave Secreta (Base32)</Label>
        <Input
          id="2fa-secretKey"
          placeholder="Ej: JBSWY3DPEHPK3PXP"
          required
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        <PlusIcon className="mr-2 h-4 w-4" />
        {isLoading ? "Guardando..." : "Añadir Clave 2FA"}
      </Button>
    </form>
  )
}
