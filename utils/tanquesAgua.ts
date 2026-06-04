export type TanqueAgua = {
  id?: number
  nombre: string
  capacidadLitros?: number | null
  litros: number
}

export const defaultTanquesAgua = (): TanqueAgua[] => [
  { nombre: 'Tanque 1', litros: 0 },
  { nombre: 'Tanque 2', litros: 0 },
  { nombre: 'Tanque 3', litros: 0 },
]

export const mapTanquesCatalogo = (items: any[]): TanqueAgua[] =>
  items.length
    ? items.map((tanque: any) => ({
        id: tanque.id,
        nombre: tanque.nombre,
        capacidadLitros: tanque.capacidadLitros,
        litros: 0,
      }))
    : defaultTanquesAgua()
