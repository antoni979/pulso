import { ref } from 'vue'

export function useImageCapture() {
  const imageData = ref<string | null>(null)
  const isCapturing = ref(false)
  const error = ref<string | null>(null)

  // Capturar desde cámara o seleccionar archivo
  const captureImage = async (useCamera: boolean = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      error.value = null

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      if (useCamera) {
        input.capture = 'environment' // Usar cámara trasera en móviles
      }

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) {
          reject(new Error('No se seleccionó ninguna imagen'))
          return
        }

        try {
          const base64 = await fileToBase64(file)
          imageData.value = base64
          resolve(base64)
        } catch (err) {
          error.value = 'Error al procesar la imagen'
          reject(err)
        }
      }

      input.click()
    })
  }

  // Limpiar imagen
  const clearImage = () => {
    imageData.value = null
    error.value = null
  }

  return {
    imageData,
    isCapturing,
    error,
    captureImage,
    clearImage
  }
}

// Función auxiliar para convertir File a base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
