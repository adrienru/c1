"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"
import { addPassword } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { PasswordGeneratorDialog } from "@/components/password-generator-dialog" // Asegúrate de que esta importación sea correcta
import { Dialog, DialogTrigger } from "@/components/ui/dialog" // Importa Dialog y DialogTrigger

export default function PasswordForm() {
  const [serviceName, setServiceName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await addPassword(serviceName, username, password)
      if (result.success) {
        toast({
          title: "Contraseña añadida",
          description: "La contraseña ha sido guardada exitosamente.",
        })
        setServiceName("")
        setUsername("")
        setPassword("")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo añadir la contraseña.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding password:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al añadir la contraseña.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseGeneratedPassword = (generatedPass: string) => {
    setPassword(generatedPass)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="serviceName">Nombre del Servicio</Label>
        <Input
          id="serviceName"
          placeholder="Ej: Google, Facebook"
          required
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Usuario/Email</Label>
        <Input
          id="username"
          placeholder="tu_usuario@ejemplo.com"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative flex items-center">
          {" "}
          {/* Contenedor para el input y el botón */}
          <Input
            id="password"
            type="text" // Cambiado a text para que se vea la contraseña generada
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10" // Añade padding a la derecha para el botón
          />
          <div className="absolute right-2">
            {" "}
            {/* Posiciona el botón a la derecha */}
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Generar contraseña">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <PasswordGeneratorDialog onGenerate={handleUseGeneratedPassword} />
            </Dialog>
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        <PlusIcon className="mr-2 h-4 w-4" />
        {isLoading ? "Añadiendo..." : "Añadir Contraseña"}
      </Button>
    </form>
  )
}
