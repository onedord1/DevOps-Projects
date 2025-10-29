'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { FileText, Download, Copy, Check } from 'lucide-react'

interface PostMortemViewerProps {
  incidentId: string
}

export function PostMortemViewer({ incidentId }: PostMortemViewerProps) {
  const [postMortem, setPostMortem] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState('')

  const generatePostMortem = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incidents/${incidentId}/post-mortem`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      )
      
      if (response.ok) {
        const markdown = await response.json()
        setPostMortem(markdown)
      } else {
        setError('Failed to generate post-mortem')
      }
    } catch (err) {
      setError('Error generating post-mortem')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postMortem)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const downloadAsMarkdown = () => {
    const blob = new Blob([postMortem], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `post-mortem-${incidentId}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {!postMortem && (
        <Button
          onClick={generatePostMortem}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          {isLoading ? 'Generating...' : 'Generate Post-Mortem'}
        </Button>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {postMortem && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title={isCopied ? "Copied!" : "Copy to Clipboard"}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={downloadAsMarkdown}
              variant="outline"
              size="icon"
              className="hover:bg-green-50 dark:hover:bg-green-900/20"
              title="Download as Markdown"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
              {postMortem}
            </pre>
          </div>

          <Button
            onClick={() => setPostMortem('')}
            variant="ghost"
            className="w-full"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
