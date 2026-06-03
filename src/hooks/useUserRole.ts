import { useAuthStore } from '../store/authStore'

export function useUserRole() {
  const { rol, localidad, displayName, estado } = useAuthStore()

  return {
    rol,
    localidad,
    displayName,
    estado,
    isPending: rol === null || estado === 'pendiente',
    isAdmin: rol === 'admin',
    isCoordinador: rol === 'coordinador',
    isAgente: rol === 'agente_municipio',
    canEditNinos: rol === 'admin' || rol === 'coordinador',
    canManageUsers: rol === 'admin',
  }
}
