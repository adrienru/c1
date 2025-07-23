import { requireAuth } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOutIcon } from "lucide-react"
import { logout } from "./actions"
import PasswordForm from "./password-form"
import PasswordList from "./password-list"
import { SecurityAuditor } from "@/components/security-auditor"
import { TwoFactorAuthForm } from "@/components/two-factor-auth-form" // Importa el nuevo formulario 2FA
import { TwoFactorAuthList } from "@/components/two-factor-auth-list" // Importa la nueva lista 2FA

export default async function DashboardPage() {
  const userId = await requireAuth()

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestor de Contraseñas</h1>
        <form action={logout}>
          <Button variant="outline" size="sm">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </form>
      </header>

      <main className="flex-1 flex flex-col gap-6">
        {/* Auditor de Seguridad - Colocado en la parte superior */}
        <SecurityAuditor userId={userId} />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sección de Contraseñas */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Nueva Contraseña</CardTitle>
              <CardDescription>Introduce los detalles de la nueva contraseña.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tus Contraseñas</CardTitle>
              <CardDescription>Gestiona tus contraseñas guardadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordList userId={userId} />
            </CardContent>
          </Card>
        </div>

        {/* Nueva Sección para Gestor de Llaves 2FA */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Añadir Clave 2FA</CardTitle>
              <CardDescription>Introduce la clave secreta para un nuevo servicio 2FA.</CardDescription>
            </CardHeader>
            <CardContent>
              <TwoFactorAuthForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tus Claves 2FA</CardTitle>
              <CardDescription>Genera códigos TOTP para tus servicios.</CardDescription>
            </CardHeader>
            <CardContent>
              <TwoFactorAuthList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
