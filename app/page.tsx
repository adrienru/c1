// No se necesita "use client" aquí, ya que solo usamos elementos HTML nativos y Link de Next.js
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-center p-4">
      <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
        Tu Gestor de Contraseñas Seguro
      </h1>
      <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mb-10">
        Mantén todas tus contraseñas seguras y organizadas en un solo lugar. Accede a ellas fácilmente cuando las
        necesites.
      </p>
      <div className="flex gap-4">
        <Link href="/login" passHref>
          <a
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 py-3 text-lg
                       bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Iniciar Sesión
          </a>
        </Link>
        <Link href="/login?register=true" passHref>
          <a
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 py-3 text-lg
                       border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
          >
            Registrarse
          </a>
        </Link>
      </div>
    </div>
  )
}
