<template>
  <div class="tiptap-wrapper">
    <div v-if="editor" class="flex items-center gap-0.5 mb-2 border-b border-vault-border pb-2">
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        class="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors"
        :class="editor.isActive('bold') ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        class="w-7 h-7 rounded flex items-center justify-center text-xs italic transition-colors"
        :class="editor.isActive('italic') ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        title="Italic"
      >
        I
      </button>
      <div class="w-px h-4 bg-vault-border mx-1" />
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        class="w-7 h-7 rounded flex items-center justify-center transition-colors"
        :class="editor.isActive('bulletList') ? 'bg-vault-accent/20 text-vault-accent' : 'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        title="Bullet List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </button>
      <div class="w-px h-4 bg-vault-border mx-1" />
      <!-- Gallery upload -->
      <button
        type="button"
        @click="galleryInput?.click()"
        :disabled="imageUploading"
        class="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
        :class="'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        title="Upload foto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM8.25 8.625a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
        </svg>
      </button>
      <!-- Camera capture -->
      <button
        type="button"
        @click="cameraInput?.click()"
        :disabled="imageUploading"
        class="w-7 h-7 rounded flex items-center justify-center transition-colors disabled:opacity-30"
        :class="'text-vault-muted hover:text-vault-text hover:bg-vault-bg'"
        title="Ambil foto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
      </button>
      <!-- Upload indicator -->
      <div v-if="imageUploading" class="ml-1 flex items-center gap-1">
        <div class="w-3.5 h-3.5 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
        <span class="text-[10px] text-vault-muted">Upload...</span>
      </div>
    </div>
    <EditorContent :editor="editor" />
    <input ref="galleryInput" type="file" accept="image/*" multiple class="hidden" @change="handleGallerySelect" />
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="handleCameraCapture" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
}>()

const emit = defineEmits(['update:modelValue'])

const galleryInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const imageUploading = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      code: false,
      strike: false,
    }),
    Placeholder.configure({
      placeholder: props.placeholder || 'Tulis sesuatu...',
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor w-full bg-vault-bg border border-vault-border rounded-xl p-3 text-vault-text text-sm min-h-[150px] max-h-[300px] overflow-y-auto focus:outline-none focus:border-vault-accent/30 transition-colors',
    },
    transformPastedHTML(html: string) {
      const doc = new DOMParser().parseFromString(html, 'text/html')

      const walk = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return (node.textContent || '')
            .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
            .replace(/[^\S\n ]+/g, ' ')
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return ''

        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        const children = Array.from(node.childNodes).map(walk).join('')

        if (tag === 'p' || tag === 'div') return `<p>${children}</p>`
        if (tag === 'br') return '<br>'
        if (tag === 'ul') return `<ul>${children}</ul>`
        if (tag === 'ol') return `<ul>${children}</ul>`
        if (tag === 'li') return `<li>${children}</li>`
        if (tag === 'strong' || tag === 'b') return `<strong>${children}</strong>`
        if (tag === 'em' || tag === 'i') return `<em>${children}</em>`
        if (tag === 'img') {
          const src = el.getAttribute('src')
          if (src) return `<img src="${src}" />`
          return ''
        }

        return children
      }

      return walk(doc.body)
    },
    handleDrop: (view, event) => {
      const files = event.dataTransfer?.files
      if (files && files.length > 0) {
        event.preventDefault()
        Array.from(files).forEach(file => {
          if (file.type.startsWith('image/')) insertImageFile(file)
        })
        return true
      }
      return false
    },
    handlePaste: (view, event) => {
      const items = event.clipboardData?.items
      if (items) {
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) insertImageFile(file)
            return true
          }
        }
      }
      return false
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

const insertImageFile = async (file: File) => {
  if (!props.onImageUpload || !editor.value) return
  imageUploading.value = true
  try {
    const url = await props.onImageUpload(file)
    editor.value.chain().focus().setImage({ src: url }).run()
  } catch (e) {
    console.error('Image upload failed:', e)
  } finally {
    imageUploading.value = false
  }
}

const handleGallerySelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  Array.from(input.files).forEach(file => {
    if (file.type.startsWith('image/')) insertImageFile(file)
  })
  input.value = ''
}

const handleCameraCapture = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  insertImageFile(input.files[0])
  input.value = ''
}

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.prose-editor p {
  margin: 0;
}
.prose-editor p + p {
  margin-top: 0.5em;
}
.prose-editor ul {
  list-style: disc;
  padding-left: 1.25em;
  margin: 0.25em 0;
}
.prose-editor li {
  margin: 0.125em 0;
}
.prose-editor li p {
  margin: 0;
}
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--v-muted);
  opacity: 0.5;
  pointer-events: none;
  height: 0;
}
.prose-editor strong {
  font-weight: 700;
}
.prose-editor em {
  font-style: italic;
}
.prose-editor img.editor-image {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5em 0;
  cursor: default;
}
.prose-editor .ProseMirror-selectednode img {
  outline: 2px solid var(--v-accent);
  outline-offset: 2px;
  border-radius: 0.5rem;
}
</style>
