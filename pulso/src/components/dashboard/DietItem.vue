<script setup>
defineProps({
  item: { type: Object, required: true }
});
const emit = defineEmits(['edit', 'delete']);
</script>

<template>
  <li class="flex justify-between items-center group text-gray-600 hover:bg-slate-100 rounded p-1">
    <span>
      {{ item.cantidad }}{{ item.alimento.unidad_porcion === 'gramos' ? 'g' : 'u' }} - {{ item.alimento.nombre }}
    </span>
    <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
      <button @click="emit('edit', item)" title="Editar">
        <!-- Icono de lápiz (SVG) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
      </button>
      <button @click="emit('delete', item)" title="Eliminar">
        <!-- Icono de basura (SVG) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  </li>
</template>