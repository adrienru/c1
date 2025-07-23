"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, signup } from "./actions"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [identifier, setIdentifier] = useState("") // Cambiado de email a identifier
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let result
      if (isLogin) {
        result = await login(identifier, password) // Pasa identifier para login
      } else {
        result = await signup(identifier, username, password) // identifier es el email para signup
      }

      if (result.success) {
        toast({
          title: isLogin ? "Inicio de sesión exitoso" : "Registro exitoso",
          description: isLogin ? "Bienvenido de nuevo." : "Tu cuenta ha sido creada.",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: result.error || "Ocurrió un error inesperado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Authentication error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{isLogin ? "Iniciar Sesión" : "Registrarse"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Ingresa tu correo o nombre de usuario y contraseña para acceder a tu cuenta."
              : "Crea una cuenta para empezar a gestionar tus contraseñas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {isLogin ? "Correo Electrónico o Nombre de Usuario" : "Correo Electrónico"}
              </Label>
              <Input
                id="identifier"
                type="text" // Cambiado a text para permitir nombres de usuario
                placeholder={isLogin ? "tu_usuario@ejemplo.com o tu_nombre_de_usuario" : "m@example.com"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            {!isLogin && ( // Muestra el campo de nombre de usuario solo en el registro
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="tu_nombre_de_usuario"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isLogin ? "Iniciando..." : "Registrando...") : isLogin ? "Iniciar Sesión" : "Registrarse"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="p-0 h-auto">
              {isLogin ? "Regístrate" : "Inicia Sesión"}
            </Button>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Al continuar, aceptas nuestra{" "}
            <a href="#" className="underline hover:text-gray-700 dark:hover:text-gray-300">
              Política de Privacidad
            </a>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
