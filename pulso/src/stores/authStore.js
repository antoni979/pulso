// src/stores/authStore.js
import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, 
    session: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userRole: (state) => state.user?.rol || null, 
  },

  actions: {
    // Función privada para obtener el perfil de un usuario
    async _getProfile(userId) {
      const { data, error } = await supabase
        .from('perfiles') 
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error
      }
      return data
    },

    async signUp(email, password, metadata = {}) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      if (error) throw error;
      return data
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      this.session = data.session
      this.user = await this._getProfile(data.user.id)
      
      return data
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      this.user = null
      this.session = null
    },
    
    async initialize() {
      const { data } = await supabase.auth.getSession()
      this.session = data.session

      if (this.session) {
        this.user = await this._getProfile(this.session.user.id)
      } else {
        this.user = null
      }
    },

    async updateProfile(updates) {
      if (!this.user) return;

      const { data, error } = await supabase
        .from('perfiles')
        .update(updates)
        .eq('id', this.user.id)
        .select()
        .single()

      if (error) throw error

      this.user = { ...this.user, ...data }
      return data;
    },

    // --- NUEVA ACCIÓN PARA EL NUTRICIONISTA ---
    async crearCliente(email, password, nombre_completo) {
      const { data, error } = await supabase.functions.invoke('crear-cliente', {
        body: { email, password, nombre_completo },
      })

      if (error) {
        throw new Error(error.message)
      }
      
      // La Edge Function puede devolver un error en su propiedad 'error'
      if (data.error) {
        throw new Error(data.error)
      }

      return data;
    },
  }
})