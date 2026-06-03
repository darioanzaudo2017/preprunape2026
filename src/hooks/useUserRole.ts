import { useAuthStore } from '../store/authStore'

export function useUserRole() {
  const { rol, localidad, displayName } = useAuthStore()

  return {
    rol,
    localidad,
    displayName,
    isAdmin: rol === 'admin',
    isCoordinador: rol === 'coordinador',
    isAgente: rol === 'agente_municipio',
    canEditNinos: rol === 'admin' || rol === 'coordinador',
    canManageUsers: rol === 'admin',
  }
}
