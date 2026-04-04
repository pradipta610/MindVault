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
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

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
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor w-full bg-vault-bg border border-vault-border rounded-xl p-3 text-vault-text text-sm min-h-[150px] max-h-[300px] overflow-y-auto focus:outline-none focus:border-vault-accent/30 transition-colors',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
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
</style>
