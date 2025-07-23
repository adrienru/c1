"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, ShieldCheck, Info } from "lucide-react"
import { getSecurityAuditResults } from "@/app/dashboard/actions" // Importa la nueva Server Action
import { useToast } from "@/hooks/use-toast"

interface AuditResults {
  score: number
  weakCount: number
  reusedCount: number
  oldCount: number
  totalPasswords: number
}

export function SecurityAuditor({ userId }: { userId: string }) {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true)
      const result = await getSecurityAuditResults()
      if (result.success && result.score !== undefined) {
        setAuditResults({
          score: result.score,
          weakCount: result.weakCount || 0,
          reusedCount: result.reusedCount || 0,
          oldCount: result.oldCount || 0,
          totalPasswords: result.totalPasswords || 0,
        })
      } else {
        toast({
          title: "Error de Auditoría",
          description: result.error || "No se pudieron cargar los resultados de la auditoría.",
          variant: "destructive",
        })
      }
      setLoading(false)
    }
    fetchAudit()
  }, [userId, toast])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auditor de Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400">Cargando auditoría de seguridad...</p>
        </CardContent>
      </Card>
    )
  }

  if (!auditResults) {
    return null // O un mensaje de error si la carga falló y no hay resultados
  }

  const { score, weakCount, reusedCount, oldCount, totalPasswords } = auditResults

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditor de Seguridad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Puntuación de Seguridad</span>
            <span className="text-sm font-medium">{score}%</span>
          </div>
          <Progress value={score} className="w-full" />
        </div>

        {totalPasswords === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Sin Contraseñas</AlertTitle>
            <AlertDescription>Añade algunas contraseñas para empezar la auditoría de seguridad.</AlertDescription>
          </Alert>
        )}

        {totalPasswords > 0 && score < 100 && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>¡Atención!</AlertTitle>
            <AlertDescription>
              Tienes problemas de seguridad:
              {weakCount > 0 && ` ${weakCount} contraseñas débiles.`}
              {reusedCount > 0 && ` ${reusedCount} contraseñas reutilizadas.`}
              {oldCount > 0 && ` ${oldCount} contraseñas antiguas.`}
              <br />
              Considera actualizarlas para mejorar tu seguridad.
            </AlertDescription>
          </Alert>
        )}

        {totalPasswords > 0 && score === 100 && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>¡Excelente!</AlertTitle>
            <AlertDescription>Todas tus contraseñas son fuertes, únicas y actualizadas.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
