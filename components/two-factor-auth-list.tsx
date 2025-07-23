"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CopyIcon, TrashIcon } from "lucide-react" // Importa RefreshCwIcon
import { useToast } from "@/hooks/use-toast"
import { getTwoFactorAuthKeys, deleteTwoFactorAuthKey, generateTotpCode } from "@/app/dashboard/actions"

interface TwoFactorAuthKey {
  id: string
  service_name: string
  account_name: string
  created_at: string
  encrypted_secret: string // Necesario para pasar a generateTotpCode
}

export function TwoFactorAuthList() {
  const [keys, setKeys] = useState<TwoFactorAuthKey[]>([])
  const [loading, setLoading] = useState(true)
  const [generatedCodes, setGeneratedCodes] = useState<Record<string, string>>({}) // { keyId: totpCode }
  const [countdown, setCountdown] = useState<Record<string, number>>({}) // { keyId: secondsLeft }
  const { toast } = useToast()

  const fetchKeys = async () => {
    setLoading(true)
    const result = await getTwoFactorAuthKeys()
    if (result.success && result.data) {
      setKeys(result.data)
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudieron cargar las claves 2FA.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  // Generar códigos TOTP y manejar el temporizador
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const newCountdown: Record<string, number> = {}
      let shouldGenerateNewCodes = false

      keys.forEach((key) => {
        const secondsLeft = 30 - (now % 30)
        newCountdown[key.id] = secondsLeft
        if (secondsLeft === 30 || secondsLeft === 0) {
          // Generar nuevo código al inicio de cada ciclo
          shouldGenerateNewCodes = true
        }
      })
      setCountdown(newCountdown)

      if (shouldGenerateNewCodes) {
        keys.forEach(async (key) => {
          const result = await generateTotpCode(key.id)
          if (result.success && result.token) {
            setGeneratedCodes((prev) => ({ ...prev, [key.id]: result.token }))
          } else {
            toast({
              title: "Error al generar TOTP",
              description: result.error || "No se pudo generar el código para " + key.service_name,
              variant: "destructive",
            })
          }
        })
      }
    }, 1000) // Actualizar cada segundo

    // Generar códigos iniciales al cargar
    keys.forEach(async (key) => {
      const result = await generateTotpCode(key.id)
      if (result.success && result.token) {
        setGeneratedCodes((prev) => ({ ...prev, [key.id]: result.token }))
      } else {
        toast({
          title: "Error al generar TOTP",
          description: result.error || "No se pudo generar el código para " + key.service_name,
          variant: "destructive",
        })
      }
    })

    return () => clearInterval(interval) // Limpiar el intervalo al desmontar
  }, [keys, toast]) // Dependencia en 'keys' para re-ejecutar si las claves cambian

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta clave 2FA?")) {
      const result = await deleteTwoFactorAuthKey(id)
      if (result.success) {
        toast({
          title: "Clave 2FA eliminada",
          description: "La clave de autenticación de dos factores ha sido eliminada.",
        })
        fetchKeys() // Volver a cargar la lista
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar la clave 2FA.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Código Copiado",
      description: "El código TOTP ha sido copiado al portapapeles.",
    })
  }

  if (loading) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Cargando claves 2FA...</p>
  }

  return (
    <div className="overflow-x-auto">
      {keys.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No tienes claves 2FA guardadas aún.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Código TOTP</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.service_name}</TableCell>
                <TableCell>{key.account_name}</TableCell>
                <TableCell className="font-mono text-lg flex items-center gap-2">
                  {generatedCodes[key.id] || "Cargando..."}
                  {countdown[key.id] !== undefined && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">({countdown[key.id]}s)</span>
                  )}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => generatedCodes[key.id] && handleCopyCode(generatedCodes[key.id])}
                    aria-label="Copiar código TOTP"
                    disabled={!generatedCodes[key.id]}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(key.id)}
                    aria-label="Eliminar clave 2FA"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
