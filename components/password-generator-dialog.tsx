"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider" // Importa Slider
import { Checkbox } from "@/components/ui/checkbox" // Importa Checkbox
import { CopyIcon } from "lucide-react" // Importa CopyIcon
import { useToast } from "@/hooks/use-toast" // Importa useToast

interface PasswordGeneratorDialogProps {
  onGenerate: (password: string) => void
}

export function PasswordGeneratorDialog({ onGenerate }: PasswordGeneratorDialogProps) {
  const [length, setLength] = useState(12)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const { toast } = useToast()

  const generatePassword = () => {
    let charset = ""
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()-_=+" // Caracteres comunes, puedes expandir

    if (charset.length === 0) {
      setGeneratedPassword("")
      toast({
        title: "Error de Generación",
        description: "Debes seleccionar al menos un tipo de carácter.",
        variant: "destructive",
      })
      return
    }

    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setGeneratedPassword(password)
    onGenerate(password) // Pasa la contraseña generada al componente padre
  }

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      toast({
        title: "Contraseña Copiada",
        description: "La contraseña generada ha sido copiada al portapapeles.",
      })
    }
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Generador de Contraseñas</DialogTitle>
        <DialogDescription>Crea contraseñas fuertes y seguras con opciones personalizadas.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="length">Longitud: {length}</Label>
          <Slider
            id="length"
            min={8}
            max={32}
            step={1}
            value={[length]}
            onValueChange={(val) => setLength(val[0])}
            className="w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="uppercase"
            checked={includeUppercase}
            onCheckedChange={(checked) => setIncludeUppercase(Boolean(checked))}
          />
          <Label htmlFor="uppercase">Mayúsculas (A-Z)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="lowercase"
            checked={includeLowercase}
            onCheckedChange={(checked) => setIncludeLowercase(Boolean(checked))}
          />
          <Label htmlFor="lowercase">Minúsculas (a-z)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="numbers"
            checked={includeNumbers}
            onCheckedChange={(checked) => setIncludeNumbers(Boolean(checked))}
          />
          <Label htmlFor="numbers">Números (0-9)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="symbols"
            checked={includeSymbols}
            onCheckedChange={(checked) => setIncludeSymbols(Boolean(checked))}
          />
          <Label htmlFor="symbols">Símbolos (!@#$)</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="generated-password">Contraseña Generada</Label>
          <div className="relative">
            <Input id="generated-password" type="text" readOnly value={generatedPassword} className="font-mono pr-10" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2"
              onClick={handleCopy}
            >
              <CopyIcon className="h-4 w-4" />
              <span className="sr-only">Copiar</span>
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={generatePassword}>Generar</Button>
      </DialogFooter>
    </DialogContent>
  )
}
