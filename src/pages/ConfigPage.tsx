import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserRole } from '../hooks/useUserRole'
import { toast } from 'sonner'
import {
  Users,
  Building,
  Sliders,
  Settings,
  ShieldAlert,
  Loader2,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  MapPin,
  AlertTriangle
} from 'lucide-react'
import type { UserRol } from '../store/authStore'

interface UserRowData {
  iduser: string
  display_name: string | null
  email: string | null
  rol: UserRol | null
  Localidad: string | null
  estado: string | null
  created_at: string
}

interface LocalidadMapped {
  id: number
  nombre: string
}

interface ConfigFormularioData {
  formulario: string
  max_no_pasa: number
  descripcion: string | null
  updated_at: string
}

export default function ConfigPage() {
  const { isAdmin } = useUserRole()
  const queryClient = useQueryClient()

  // Tabs State: 'usuarios' | 'localidades' | 'formularios'
  const [activeTab, setActiveTab] = useState<'usuarios' | 'localidades' | 'formularios'>('usuarios')

  // Search Filter for Users list
  const [userSearch, setUserSearch] = useState('')

  // Modal State for Editing User
  const [editingUser, setEditingUser] = useState<UserRowData | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editRol, setEditRol] = useState<UserRol>('agente_municipio')
  const [editLocalidad, setEditLocalidad] = useState('')
  const [editEstado, setEditEstado] = useState('Activo')

  // Add Localidad State
  const [newLocalidadName, setNewLocalidadName] = useState('')

  // Inline Delete confirmation state: { [localidadId]: boolean }
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<Record<number, boolean>>({})

  // Form Config Local Inputs State: { [formularioName]: number }
  const [formInputs, setFormInputs] = useState<Record<string, number>>({})

  // 1. Fetch Users — via RPC para incluir email desde auth.users
  const { data: usersList, isLoading: isLoadingUsers } = useQuery<UserRowData[]>({
    queryKey: ['users-list'],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_users_with_email')
      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }
      return (data ?? []) as UserRowData[]
    }
  })

  // 2. Fetch Localidades (using case-sensitive table 'Localidad')
  const { data: localidadesList, isLoading: isLoadingLocalidades } = useQuery<LocalidadMapped[]>({
    queryKey: ['localidades-list'],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Localidad')
        .select('*')
        .order('Localidad', { ascending: true })

      if (error) {
        console.error('Error fetching localidades:', error)
        throw error
      }

      return (data || []).map(row => ({
        id: row.id,
        nombre: row.Localidad
      }))
    }
  })

  // 3. Fetch Form configs
  const { data: formConfigs, isLoading: isLoadingConfigs } = useQuery<ConfigFormularioData[]>({
    queryKey: ['config-formularios-list'],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_formularios')
        .select('*')
        .order('formulario', { ascending: true })

      if (error) {
        console.error('Error fetching configs:', error)
        throw error
      }
      
      // Initialize local inputs
      const inputsMap: Record<string, number> = {}
      data?.forEach(row => {
        inputsMap[row.formulario] = row.max_no_pasa
      })
      setFormInputs(inputsMap)

      return data as ConfigFormularioData[]
    }
  })

  // Calculate user count per localidad
  const getUserCountForLocalidad = (locName: string): number => {
    if (!usersList) return 0
    return usersList.filter(u => u.Localidad?.trim().toLowerCase() === locName.trim().toLowerCase()).length
  }

  // --- MUTATIONS ---

  // 1. Update User Profile Mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updated: { iduser: string; display_name: string; rol: UserRol; Localidad: string; estado: string }) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: updated.display_name,
          rol: updated.rol,
          Localidad: updated.Localidad || null,
          estado: updated.estado
        })
        .eq('iduser', updated.iduser)

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('¡Perfil de usuario actualizado con éxito!')
      setEditingUser(null)
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Error al actualizar el usuario.')
    }
  })

  // 2. Add Localidad Mutation
  const addLocalidadMutation = useMutation({
    mutationFn: async (nombre: string) => {
      const cleanName = nombre.trim()
      if (!cleanName) throw new Error('El nombre de la localidad no puede estar vacío.')

      const { data, error } = await supabase
        .from('Localidad')
        .insert({ Localidad: cleanName })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('¡Nueva localidad agregada con éxito!')
      setNewLocalidadName('')
      queryClient.invalidateQueries({ queryKey: ['localidades-list'] })
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Error al agregar la localidad.')
    }
  })

  // 3. Delete Localidad Mutation
  const deleteLocalidadMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('Localidad')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Localidad eliminada con éxito.')
      queryClient.invalidateQueries({ queryKey: ['localidades-list'] })
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Error al eliminar la localidad.')
    }
  })

  // 4. Update Form Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updated: { formulario: string; max_no_pasa: number }) => {
      const { data, error } = await supabase
        .from('config_formularios')
        .update({ max_no_pasa: updated.max_no_pasa })
        .eq('formulario', updated.formulario)

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      toast.success(`¡Configuración de ${variables.formulario} guardada!`)
      queryClient.invalidateQueries({ queryKey: ['config-formularios-list'] })
    },
    onError: (err: any) => {
      console.error(err)
      toast.error(err.message || 'Error al guardar la configuración del formulario.')
    }
  })

  // Access check
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center max-w-md mx-auto space-y-4">
        <div className="bg-red-50 p-4 rounded-full text-red-500 ring-8 ring-red-50">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800 font-display">Acceso Denegado</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Esta pantalla de administración y configuración del sistema solo está disponible para usuarios con rol de **Administrador**.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-6 py-2 rounded-full text-xs font-semibold shadow-sm transition-all"
        >
          Volver al Inicio
        </Link>
      </div>
    )
  }

  // Loading indicator for background dependencies
  const isGlobalLoading = isLoadingUsers || isLoadingLocalidades || isLoadingConfigs

  // Filtered users list
  const filteredUsers = (usersList || []).filter(u => {
    const term = userSearch.toLowerCase().trim()
    if (!term) return true
    return (
      u.display_name?.toLowerCase().includes(term) ||
      u.rol?.toLowerCase().includes(term) ||
      u.Localidad?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="p-8 md:p-10 max-w-[1200px] mx-auto w-full space-y-8 bg-[#f7f9fb] min-h-screen">
      {/* Page Title */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-display leading-tight flex items-center gap-2.5">
            <Settings className="h-8 w-8 text-primary" /> Panel de Configuración
          </h2>
          <p className="text-sm text-slate-500">
            Administre usuarios del municipio, localidades asociadas y parámetros críticos del cuestionario clínico.
          </p>
        </div>
      </header>

      {/* Tabs Menu Navigation */}
      <nav className="flex gap-2 p-1.5 bg-white border border-outline-variant/30 rounded-2xl shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'usuarios'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" /> Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab('localidades')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'localidades'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building className="h-4 w-4" /> Localidades
        </button>
        <button
          onClick={() => setActiveTab('formularios')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'formularios'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sliders className="h-4 w-4" /> Config. de Formularios
        </button>
      </nav>

      {/* Content Area */}
      {isGlobalLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-slate-400 font-semibold">Cargando base de datos del panel...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: GESTIÓN DE USUARIOS */}
          {activeTab === 'usuarios' && (
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                <h3 className="text-lg font-bold text-on-surface font-display">Usuarios del Sistema</h3>
                
                {/* Search input */}
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre o rol..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full md:w-80 px-4 py-2 border border-outline rounded-xl bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  No se encontraron usuarios registrados o con el filtro ingresado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#545f73] text-white">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider pl-8">Nombre Completo</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Rol de Acceso</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Localidad Asignada</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center">Estado</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((userRow) => (
                        <tr key={userRow.iduser} className={`hover:bg-slate-50 transition-colors ${!userRow.rol || userRow.estado === 'pendiente' ? 'bg-orange-50/50' : ''}`}>
                          <td className="px-6 py-4 pl-8">
                            <span className="text-sm font-bold text-slate-800">
                              {userRow.display_name || 'Sin nombre registrado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                            {userRow.email || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              !userRow.rol
                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                : userRow.rol === 'admin'
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : userRow.rol === 'coordinador'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {userRow.rol || 'Sin asignar'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                            {userRow.Localidad || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              userRow.estado === 'pendiente' || !userRow.estado
                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}>
                              {userRow.estado || 'pendiente'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setEditingUser(userRow)
                                  setEditDisplayName(userRow.display_name || '')
                                  setEditRol(userRow.rol ?? 'agente_municipio')
                                  setEditLocalidad(userRow.Localidad || '')
                                  setEditEstado(userRow.estado || 'pendiente')
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-full transition-all active:scale-95 text-xs font-semibold"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOCALIDADES */}
          {activeTab === 'localidades' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to add locality */}
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6 space-y-4 self-start">
                <h4 className="text-base font-bold text-on-surface font-display flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MapPin className="h-4.5 w-4.5 text-primary" /> Agregar Localidad
                </h4>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="newLoc">
                      Nombre de la Localidad
                    </label>
                    <input
                      id="newLoc"
                      type="text"
                      placeholder="Ej. Alta Gracia"
                      value={newLocalidadName}
                      onChange={(e) => setNewLocalidadName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[#f7f9fb] transition-all text-sm font-medium"
                    />
                  </div>

                  <button
                    onClick={() => addLocalidadMutation.mutate(newLocalidadName)}
                    disabled={addLocalidadMutation.isPending || !newLocalidadName.trim()}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> Agregar Localidad
                  </button>
                </div>
              </div>

              {/* Localities list table */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-base font-bold text-on-surface font-display">Localidades Configuradas</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#545f73] text-white">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider pl-8">ID</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Nombre Localidad</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center">Usuarios Asignados</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(localidadesList || []).map((loc) => {
                        const userCount = getUserCountForLocalidad(loc.nombre)
                        const hasUsers = userCount > 0
                        const isConfirming = confirmDeleteLoc[loc.id]

                        return (
                          <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 pl-8 text-sm font-medium text-slate-400">
                              {loc.id}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-800">
                              {loc.nombre}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                hasUsers ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {userCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isConfirming ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-[10px] text-red-500 font-bold uppercase mr-1 animate-pulse">¿Confirmar?</span>
                                  <button
                                    onClick={() => deleteLocalidadMutation.mutate(loc.id)}
                                    className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all"
                                  >
                                    Eliminar
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteLoc(prev => ({ ...prev, [loc.id]: false }))}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold active:scale-95 transition-all"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center" title={hasUsers ? 'Tiene usuarios asignados' : ''}>
                                  <button
                                    disabled={hasUsers}
                                    onClick={() => setConfirmDeleteLoc(prev => ({ ...prev, [loc.id]: true }))}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                                      hasUsers
                                        ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                                        : 'text-red-500 hover:bg-red-50 bg-red-50/10'
                                    }`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURACIÓN DE FORMULARIOS */}
          {activeTab === 'formularios' && (
            <div className="space-y-6">
              {/* Informative Banner */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800 font-display">¿Qué significan estos valores?</h4>
                  <p className="text-xs text-amber-700 leading-relaxed mt-1">
                    Representan la **Cantidad máxima de preguntas del nivel siguiente (o preguntas "de no pasa") que un niño/a puede fallar** antes de reprobar el test de ese nivel por completo. Si se supera este límite de fallas, la sugerencia del dictamen automático de la planilla cambiará a **No Aprobado**.
                  </p>
                </div>
              </div>

              {/* Formularios Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(formConfigs || []).map((config) => {
                  const currentValue = formInputs[config.formulario] ?? config.max_no_pasa
                  const isMutationPending = updateConfigMutation.isPending && updateConfigMutation.variables?.formulario === config.formulario

                  return (
                    <div
                      key={config.formulario}
                      className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-extrabold text-primary font-display">{config.formulario}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Parámetro Hito</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          {config.descripcion || 'Sin descripción de regla.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400" htmlFor={`max-${config.formulario}`}>
                            Max. Fallas "No Pasa"
                          </label>
                          <input
                            id={`max-${config.formulario}`}
                            type="number"
                            min="1"
                            max="5"
                            value={currentValue}
                            onChange={(e) => {
                              const val = Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
                              setFormInputs(prev => ({ ...prev, [config.formulario]: val }))
                            }}
                            className="w-full px-3 py-2 border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[#f7f9fb] transition-all text-sm font-bold"
                          />
                        </div>

                        <button
                          onClick={() => updateConfigMutation.mutate({ formulario: config.formulario, max_no_pasa: currentValue })}
                          disabled={isMutationPending || currentValue === config.max_no_pasa}
                          className="bg-primary hover:brightness-110 text-on-primary p-2.5 rounded-xl transition-all self-end active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                          title="Guardar cambios"
                        >
                          {isMutationPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* --- INLINE EDIT USER MODAL DIALOG --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-outline-variant/30 max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-on-surface font-display flex items-center gap-2">
                <Edit2 className="h-4.5 w-4.5 text-primary" /> Editar Perfil de Usuario
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Display Name Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editName">
                  Nombre Completo
                </label>
                <input
                  id="editName"
                  type="text"
                  placeholder="Ej. Evelyn Díaz"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-outline rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[#f7f9fb] transition-all text-sm font-semibold"
                />
              </div>

              {/* Rol select dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editRol">
                  Rol de Acceso
                </label>
                <select
                  id="editRol"
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value as UserRol)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="admin">Administrador (admin)</option>
                  <option value="coordinador">Coordinador municipal (coordinador)</option>
                  <option value="agente_municipio">Agente de campo (agente_municipio)</option>
                </select>
              </div>

              {/* Localidad select dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editLoc">
                  Localidad
                </label>
                <select
                  id="editLoc"
                  value={editLocalidad}
                  onChange={(e) => setEditLocalidad(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Seleccione localidad</option>
                  {(localidadesList || []).map((loc) => (
                    <option key={loc.id} value={loc.nombre}>
                      {loc.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="editEstado">
                  Estado de la cuenta
                </label>
                <select
                  id="editEstado"
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline rounded-xl bg-[#f7f9fb] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="pendiente">Pendiente de aprobación</option>
                  <option value="Activo">Activo</option>
                </select>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-5 py-2.5 border border-outline rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateUserMutation.mutate({
                  iduser: editingUser.iduser,
                  display_name: editDisplayName,
                  rol: editRol,
                  Localidad: editLocalidad,
                  estado: editEstado
                })}
                disabled={updateUserMutation.isPending || !editDisplayName.trim()}
                className="bg-primary hover:brightness-110 text-on-primary px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
