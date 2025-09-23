// src/stores/authStore.js
import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // El 'user' ahora contendrá los datos del perfil de la tabla 'profiles'
    user: null, 
    session: null,
  }),

  getters: {
    // Un getter para saber fácilmente si el usuario está autenticado
    isAuthenticated: (state) => !!state.user,
    // Un getter para obtener el rol del usuario
    userRole: (state) => state.user?.role || null,
  },

  actions: {
    // Función privada para obtener el perfil de un usuario
    async _getProfile(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single() // .single() devuelve un objeto en lugar de un array

      if (error && error.code !== 'PGRST116') { // PGRST116 es 'no rows found', lo ignoramos
        throw error
      }
      return data
    },

    async signUp(email, password, metadata = {}) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Podemos pasar datos adicionales que el trigger usará
          data: metadata // ej: { full_name: 'Juan Perez' }
        }
      })
      if (error) throw error
      // El trigger se encargará de crear el perfil. No necesitamos hacer más.
      return data
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      this.session = data.session
      // Tras iniciar sesión, obtenemos su perfil
      this.user = await this._getProfile(data.user.id)
      
      return data
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      this.user = null
      this.session = null
    },
    
    // fetchUser ahora se convierte en la función principal de inicialización
    async initialize() {
      const { data } = await supabase.auth.getSession()
      this.session = data.session

      if (this.session) {
        // Si hay sesión, obtenemos el perfil del usuario
        this.user = await this._getProfile(this.session.user.id)
      } else {
        this.user = null
      }
    },

    // Acción para que un usuario actualice su propio perfil
    async updateProfile(updates) {
      if (!this.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.user.id)
        .select() // .select() para que devuelva el registro actualizado
        .single()

      if (error) throw error

      // Actualizamos el estado local con los nuevos datos
      this.user = { ...this.user, ...data }
      return data;
    }
  }
})