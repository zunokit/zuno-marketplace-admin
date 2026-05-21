'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { VariantProps } from 'class-variance-authority'

import { Button, type buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

type BaseButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>

export interface CopyButtonProps
  extends Omit<BaseButtonProps, 'onClick' | 'children'> {
  /** The string copied to the clipboard. */
  value: string
  /**
   * Optional label rendered alongside the icon. Omit for an icon-only
   * button (the typical use case for 'copy id' / 'copy ddl').
   */
  label?: string
  tooltipLabel?: string
  tooltipCopiedLabel?: string
  /** Toast title shown via sonner on success. Pass `null` to disable. */
  toastMessage?: string | null
  /** Toast title shown via sonner on failure. Pass `null` to disable. */
  errorToastMessage?: string | null
}

/**
 * Drop-in clipboard button. Renders an icon-only `Button` by default and
 * swaps between a `Copy` and `Check` icon for ~2s after each successful
 * copy. Always wrapped in a Tooltip for discoverability.
 *
 * Use this anywhere we previously hand-rolled
 * `navigator.clipboard.writeText` + setTimeout — e.g. DDL panels, project
 * id badges, invitation tokens, schema fingerprints.
 */
export function CopyButton({
  value,
  label,
  tooltipLabel = 'Copy',
  tooltipCopiedLabel = 'Copied!',
  toastMessage = 'Copied to clipboard',
  errorToastMessage = "Couldn't copy to clipboard",
  variant = 'ghost',
  size = label ? 'sm' : 'icon',
  className,
  disabled,
  ...buttonProps
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard()

  const handleClick = async () => {
    const ok = await copy(value)
    if (ok && toastMessage) {
      toast.success(toastMessage)
    } else if (!ok && errorToastMessage) {
      toast.error(errorToastMessage)
    }
  }

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || !value}
      aria-label={label ? undefined : copied ? tooltipCopiedLabel : tooltipLabel}
      aria-live="polite"
      className={cn('gap-2', className)}
      {...buttonProps}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {label ? <span>{copied ? tooltipCopiedLabel : label}</span> : null}
    </Button>
  )

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{copied ? tooltipCopiedLabel : tooltipLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
