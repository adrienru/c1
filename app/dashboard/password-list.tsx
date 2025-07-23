"use client"

import { useState, useEffect, useMemo } from "react" // Importa useEffect
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CopyIcon, TrashIcon, SearchIcon } from "lucide-react"
import { deletePassword, getDecryptedPassword, getPasswords } from "./actions" // Importa getPasswords
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface Password {
  id: string
  service_name: string
  username: string
  created_at: string
  encrypted_password: string // Asegúrate de que encrypted_password esté aquí para getDecryptedPassword
}

export default function PasswordList({ userId }: { userId: string }) {
  const [passwords, setPasswords] = useState<Password[]>([])
  const { toast } = useToast()
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // Nuevo estado de carga

  // Cargar contraseñas al montar el componente o cuando userId cambie
  useEffect(() => {
    const fetchPasswords = async () => {
      setLoading(true)
      const fetchedPasswords = await getPasswords(userId)
      setPasswords(fetchedPasswords)
      setLoading(false)
    }
    fetchPasswords()
  }, [userId]) // Dependencia en userId

  // Genera las categorías únicas a partir de los nombres de servicio
  const categories = useMemo(() => {
    const uniqueServices = new Set(passwords.map((p) => p.service_name))
    return ["Todos", ...Array.from(uniqueServices).sort()]
  }, [passwords])

  // Filtra las contraseñas según el término de búsqueda y la categoría seleccionada
  const filteredPasswords = useMemo(() => {
    let filtered = passwords

    // Filtrar por categoría
    if (selectedCategory && selectedCategory !== "Todos") {
      filtered = filtered.filter((p) => p.service_name === selectedCategory)
    }

    // Filtrar por término de búsqueda (servicio o usuario)
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.service_name.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.username.toLowerCase().includes(lowerCaseSearchTerm),
      )
    }

    return filtered
  }, [passwords, searchTerm, selectedCategory])

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta contraseña?")) {
      try {
        const result = await deletePassword(id)
        if (result.success) {
          setPasswords(passwords.filter((p) => p.id !== id))
          toast({
            title: "Contraseña eliminada",
            description: "La contraseña ha sido eliminada exitosamente.",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "No se pudo eliminar la contraseña.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error deleting password:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado al eliminar la contraseña.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCopyUsername = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "El usuario ha sido copiado al portapapeles.",
    })
  }

  const handleCopyPassword = async (id: string) => {
    setCopyingId(id)
    try {
      const result = await getDecryptedPassword(id)
      if (result.success && result.password) {
        navigator.clipboard.writeText(result.password)
        toast({
          title: "Contraseña copiada",
          description: "La contraseña ha sido copiada al portapapeles.",
        })
      } else {
        toast({
          title: "Error al copiar",
          description: result.error || "No se pudo obtener la contraseña.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al copiar contraseña:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al copiar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setCopyingId(null)
    }
  }

  if (loading) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Cargando contraseñas...</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
        <Input
          placeholder="Buscar por servicio o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categorías */}
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex w-max space-x-2 p-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={
                selectedCategory === category || (!selectedCategory && category === "Todos") ? "default" : "outline"
              }
              onClick={() => setSelectedCategory(category)}
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="overflow-x-auto">
        {filteredPasswords.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No hay contraseñas que coincidan con tu búsqueda o categoría.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPasswords.map((password) => (
                <TableRow key={password.id}>
                  <TableCell className="font-medium">{password.service_name}</TableCell>
                  <TableCell>{password.username}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyUsername(password.username)}
                      aria-label="Copiar usuario"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyPassword(password.id)}
                      aria-label="Copiar contraseña"
                      disabled={copyingId === password.id}
                    >
                      {copyingId === password.id ? (
                        <span className="animate-spin">...</span>
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(password.id)}
                      aria-label="Eliminar contraseña"
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
    </div>
  )
}
