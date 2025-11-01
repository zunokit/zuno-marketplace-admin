'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { testProjectConnectionAction } from '@/actions/projects/project-actions'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Database } from 'lucide-react'

type Project = {
  id: string
  name: string
  slug: string
}

type TestConnectionDialogProps = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TestResult = {
  success: boolean
  message: string
  details?: {
    host?: string
    database?: string
    port?: number
    responseTime?: number
  }
}

export function TestConnectionDialog({
  project,
  open,
  onOpenChange,
}: TestConnectionDialogProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  async function handleTest() {
    setIsTesting(true)
    setTestResult(null)

    const result = await testProjectConnectionAction(project.id)

    if (result.success) {
      setTestResult({
        success: true,
        message: result.message || 'Connection successful',
        details: result.data as TestResult['details'],
      })
      toast.success('Database connection test passed')
    } else {
      setTestResult({
        success: false,
        message: result.error || 'Connection failed',
      })
      toast.error('Database connection test failed')
    }

    setIsTesting(false)
  }

  function handleClose() {
    setTestResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Database Connection</DialogTitle>
          <DialogDescription>
            Test the database connection for{' '}
            <strong className="font-semibold text-foreground">{project.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!testResult && !isTesting && (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Click the button below to test the database connection
              </p>
            </div>
          )}

          {isTesting && (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <p className="mt-4 text-sm text-muted-foreground">
                Testing connection...
              </p>
            </div>
          )}

          {testResult && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testResult.message}
                  </p>
                </div>
              </div>

              {testResult.success && testResult.details && (
                <div className="space-y-2 bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Connection Details:</p>
                  <div className="space-y-1 text-sm">
                    {testResult.details.host && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Host:</span>
                        <span className="font-mono">{testResult.details.host}</span>
                      </div>
                    )}
                    {testResult.details.database && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Database:</span>
                        <span className="font-mono">{testResult.details.database}</span>
                      </div>
                    )}
                    {testResult.details.port && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Port:</span>
                        <span className="font-mono">{testResult.details.port}</span>
                      </div>
                    )}
                    {testResult.details.responseTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span className="font-mono">{testResult.details.responseTime}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isTesting}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={isTesting}>
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isTesting ? 'Testing...' : testResult ? 'Test Again' : 'Test Connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
