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

    try {
      // Compress all images in parallel
      const compressed = await Promise.all(
        files.map(file => compressImage(file))
      )
      uploadProgress.value = 30

      // Upload all compressed images in parallel
      const timestamp = Date.now()
      const uploadPromises = compressed.map(async (blob, i) => {
        const filename = `${timestamp}_${i}.jpg`
        const path = `${userId}/${noteId}/${filename}`

        const { error } = await client.storage
          .from('dump-images')
          .upload(path, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          })
        if (error) throw error

        const { data: urlData } = client.storage
          .from('dump-images')
          .getPublicUrl(path)

        return urlData?.publicUrl || null
      })

      const results = await Promise.all(uploadPromises)
      uploadProgress.value = 100
      return results.filter((url): url is string => url !== null)
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
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

  const uploadInlineImage = async (file: File): Promise<string> => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const compressed = await compressImage(file)
    const timestamp = Date.now()
    const rand = Math.random().toString(36).slice(2, 8)
    const filename = `${timestamp}_${rand}.jpg`
    const path = `${userId}/inline/${filename}`

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

    if (!urlData?.publicUrl) throw new Error('Failed to get public URL')
    return urlData.publicUrl
  }

  const extractImageUrls = (html: string): string[] => {
    if (!html) return []
    const regex = /<img[^>]+src="([^"]+)"/g
    const urls: string[] = []
    let match
    while ((match = regex.exec(html)) !== null) {
      if (match[1]) urls.push(match[1])
    }
    return urls
  }

  const cleanupOrphanedImages = async (oldHtml: string, newHtml: string) => {
    const oldUrls = extractImageUrls(oldHtml)
    const newUrls = new Set(extractImageUrls(newHtml))
    const removed = oldUrls.filter(url => !newUrls.has(url))
    if (removed.length > 0) {
      await Promise.all(removed.map(url => deleteImageByUrl(url)))
    }
  }

  const deleteImageByUrl = async (imageUrl: string) => {
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
    uploadInlineImage,
    extractImageUrls,
    cleanupOrphanedImages,
    deleteImage,
    deleteAllNoteImages,
  }
}
