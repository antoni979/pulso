import { ref } from 'vue'

export function useAudioRecorder() {
  const isRecording = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []

  const startRecording = async (): Promise<void> => {
    try {
      error.value = null
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorder = new MediaRecorder(stream)
      audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.start()
      isRecording.value = true
    } catch (err) {
      error.value = 'No se pudo acceder al micrófono. Por favor, permite el acceso.'
      console.error('Error al iniciar grabación:', err)
      throw err
    }
  }

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error('No hay grabación activa'))
        return
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })

        // Detener todos los tracks del stream
        mediaRecorder?.stream.getTracks().forEach(track => track.stop())

        isRecording.value = false
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }

  const cancelRecording = () => {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      mediaRecorder.stop()
      isRecording.value = false
      audioChunks = []
    }
  }

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording
  }
}
