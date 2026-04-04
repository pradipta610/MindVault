import { compressImage } from '~/utils/compressImage'

export const useNoteImages = () => {
  const client: any = useSupabaseClient()
  const uploading = ref(false)
  const uploadProgress = ref(0)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const uploadImages = async (noteId: string, files: File[]): Promise<string[]> => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    uploading.value = true
    uploadProgress.value = 0
    const urls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!
        const compressed = await compressImage(file)
        const ext = 'jpg'
        const filename = `${Date.now()}_${i}.${ext}`
        const path = `${userId}/${noteId}/${filename}`

        const { error } = await client.storage
          .from('dump-images')
          .upload(path, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (error) throw error

        const { data: urlData } = client.storage
          .from('dump-images')
          .getPublicUrl(path)

        if (urlData?.publicUrl) {
          urls.push(urlData.publicUrl)
        }

        uploadProgress.value = Math.round(((i + 1) / files.length) * 100)
      }
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }

    return urls
  }

  const deleteImage = async (noteId: string, imageUrl: string) => {
    const userId = await getUserId()
    if (!userId) return

    try {
      const bucketBase = '/dump-images/'
      const idx = imageUrl.indexOf(bucketBase)
      if (idx === -1) return
      const path = imageUrl.substring(idx + bucketBase.length)

      await client.storage.from('dump-images').remove([path])
    } catch (e) {
      console.error('Failed to delete image:', e)
    }
  }

  const deleteAllNoteImages = async (noteId: string) => {
    const userId = await getUserId()
    if (!userId) return

    try {
      const folderPath = `${userId}/${noteId}`
      const { data: files } = await client.storage
        .from('dump-images')
        .list(folderPath)

      if (files && files.length > 0) {
        const paths = files.map((f: any) => `${folderPath}/${f.name}`)
        await client.storage.from('dump-images').remove(paths)
      }
    } catch (e) {
      console.error('Failed to delete note images:', e)
    }
  }

  return {
    uploading,
    uploadProgress,
    uploadImages,
    deleteImage,
    deleteAllNoteImages,
  }
}
