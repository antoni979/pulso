// src/stores/dietStore.js
import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import { useAuthStore } from './authStore'

export const useDietStore = defineStore('dietas', {
  state: () => ({
    alimentos: [],
    clientes: [],
    dietaActual: null,
    cargando: false,
  }),

  actions: {
    // --- ACCIONES DE OBTENCIÓN DE DATOS ---
    async obtenerAlimentos() {
      this.cargando = true;
      const { data, error } = await supabase.from('alimentos').select('*').order('nombre');
      if (error) throw error;
      this.alimentos = data;
      this.cargando = false;
    },

    async obtenerClientes() {
      const authStore = useAuthStore();
      if (authStore.userRole !== 'nutricionista') return;
      this.cargando = true;
      const { data, error } = await supabase.from('perfiles').select('*').eq('rol', 'cliente');
      if (error) throw error;
      this.clientes = data;
      this.cargando = false;
    },

    async obtenerDietaParaCliente(clienteId, fecha) {
      this.cargando = true;
      this.dietaActual = null;
      
      const { data: datosDieta, error: errorDieta } = await supabase
        .from('dietas')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('fecha_inicio', fecha)
        .single();
      
      if (errorDieta && errorDieta.code !== 'PGRST116') throw errorDieta;
      
      if (datosDieta) {
        const { data: datosElementos, error: errorElementos } = await supabase
          .from('elementos_dieta')
          .select('*, alimentos(*)') 
          .eq('dieta_id', datosDieta.id);
        if (errorElementos) throw errorElementos;
        const elementosEstructurados = this.estructurarElementosDieta(datosElementos);
        this.dietaActual = { ...datosDieta, dias: elementosEstructurados };
      } else {
        this.dietaActual = {
          cliente_id: clienteId,
          fecha_inicio: fecha,
          nombre_plan: 'Nuevo Plan Semanal',
          dias: this.obtenerEstructuraSemanaVacia(),
        }
      }
      this.cargando = false;
    },
    
    // --- ACCIONES CRUD (Crear, Leer, Actualizar, Borrar) PARA ELEMENTOS DE LA DIETA ---

    async agregarElementoDieta(elemento) {
      const authStore = useAuthStore();
      
      // PASO 1: Si la dieta aún no ha sido guardada en la BBDD (no tiene ID), la creamos.
      if (!this.dietaActual.id) {
        const { data: nuevaDieta, error } = await supabase
          .from('dietas')
          .insert({
            nombre_plan: this.dietaActual.nombre_plan,
            cliente_id: this.dietaActual.cliente_id,
            fecha_inicio: this.dietaActual.fecha_inicio,
            nutricionista_id: authStore.user.id,
          })
          .select()
          .single();
        if (error) throw error;
        // Guardamos el ID en el estado local para futuras operaciones.
        this.dietaActual.id = nuevaDieta.id;
      }

      // PASO 2: Insertamos el nuevo elemento en la BBDD.
      const { data: nuevoElemento, error } = await supabase
        .from('elementos_dieta')
        .insert({
          dieta_id: this.dietaActual.id,
          alimento_id: elemento.alimento_id,
          dia: elemento.dia,
          comida: elemento.comida,
          cantidad: elemento.cantidad,
        })
        .select('*, alimentos(*)') // Devolvemos el elemento con los datos del alimento anidados
        .single();
      if (error) throw error;

      // PASO 3: Actualizamos el estado local para que la UI reaccione al instante.
      const dia = nuevoElemento.dia;
      const comida = nuevoElemento.comida;
      this.dietaActual.dias[dia][comida].push({
        id: nuevoElemento.id,
        alimento: nuevoElemento.alimentos,
        cantidad: nuevoElemento.cantidad,
        comida: nuevoElemento.comida,
        dia: nuevoElemento.dia,
      });
    },

    async actualizarElementoDieta(elementoId, nuevaCantidad) {
      const { data: elementoActualizado, error } = await supabase
        .from('elementos_dieta')
        .update({ cantidad: nuevaCantidad })
        .eq('id', elementoId)
        .select('*, alimentos(*)')
        .single();
      
      if (error) throw error;

      // Buscamos y actualizamos el elemento en el estado local.
      const dia = elementoActualizado.dia;
      const comida = elementoActualizado.comida;
      const index = this.dietaActual.dias[dia][comida].findIndex(item => item.id === elementoId);
      if (index !== -1) {
        this.dietaActual.dias[dia][comida][index] = {
          id: elementoActualizado.id,
          alimento: elementoActualizado.alimentos,
          cantidad: elementoActualizado.cantidad,
          comida: elementoActualizado.comida,
          dia: elementoActualizado.dia,
        };
      }
    },

    async eliminarElementoDieta(elemento) {
      const { error } = await supabase
        .from('elementos_dieta')
        .delete()
        .eq('id', elemento.id);

      if (error) throw error;

      // Eliminamos el elemento del estado local para refrescar la UI.
      const dia = elemento.dia;
      const comida = elemento.comida;
      this.dietaActual.dias[dia][comida] = this.dietaActual.dias[dia][comida].filter(item => item.id !== elemento.id);
    },
    
    // --- FUNCIONES DE AYUDA (HELPERS) ---
    estructurarElementosDieta(elementos) {
      const semana = this.obtenerEstructuraSemanaVacia();
      elementos.forEach(elemento => {
        if (elemento.alimentos) { 
            semana[elemento.dia][elemento.comida].push({
                id: elemento.id,
                alimento: elemento.alimentos,
                cantidad: elemento.cantidad,
                comida: elemento.comida,
                dia: elemento.dia,
            });
        }
      });
      return semana;
    },

    obtenerEstructuraSemanaVacia() {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      const comidas = ['desayuno', 'media mañana', 'almuerzo', 'merienda', 'cena'];
      const estructura = {};
      dias.forEach(dia => {
        estructura[dia] = {};
        comidas.forEach(comida => {
          estructura[dia][comida] = [];
        });
      });
      return estructura;
    }
  }
})