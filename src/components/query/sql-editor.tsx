'use client'

/**
 * SqlEditor Component
 * Monaco editor configured for PostgreSQL with syntax highlighting
 */

import { Editor } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Skeleton } from '@/components/ui/skeleton'

type SqlEditorProps = {
  value: string
  onChange: (value: string) => void
  height?: string
  readOnly?: boolean
}

export function SqlEditor({ value, onChange, height = '300px', readOnly = false }: SqlEditorProps) {
  const { theme } = useTheme()

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="sql"
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          readOnly,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          acceptSuggestionOnEnter: 'on',
          folding: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
        loading={
          <div className="p-4">
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-8 w-5/6" />
          </div>
        }
      />
    </div>
  )
}
