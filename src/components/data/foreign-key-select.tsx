'use client'

/**
 * ForeignKeySelect Component
 *
 * A reusable, searchable combobox for selecting foreign key values with:
 * - Real-time search with debouncing
 * - Lazy loading with pagination
 * - Display of primary label and secondary metadata
 * - Support for nullable fields
 * - Error handling and loading states
 * - Performance optimizations (caching, debouncing)
 */

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import {
  getForeignKeyOptionsAction,
  type ForeignKeyOption,
  type ForeignKeyOptionsData,
} from '@/app/actions/data/foreign-key-actions'

interface ForeignKeySelectProps {
  projectId: string
  tableName: string
  columnName: string
  value: string | number | null
  onChange: (value: string | number | null) => void
  nullable?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ForeignKeySelect({
  projectId,
  tableName,
  columnName,
  value,
  onChange,
  nullable = false,
  disabled = false,
  placeholder = 'Select...',
}: ForeignKeySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [options, setOptions] = React.useState<ForeignKeyOption[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false)
  const [offset, setOffset] = React.useState(0)

  const debouncedSearch = useDebounce(search, 300)

  const LIMIT = 50

  // Fetch options from server
  const fetchOptions = React.useCallback(
    async (searchQuery: string, currentOffset: number, append: boolean = false) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getForeignKeyOptionsAction(projectId, tableName, columnName, {
          search: searchQuery,
          limit: LIMIT,
          offset: currentOffset,
        })

        if (result.success) {
          const data: ForeignKeyOptionsData = result.data
          setOptions((prev) => append ? [...prev, ...data.options] : data.options)
          setTotalCount(data.totalCount)
          setHasLoadedOnce(true)
        } else {
          setError(result.error)
        }
      } catch {
        setError('Failed to load options')
      } finally {
        setIsLoading(false)
      }
    },
    [projectId, tableName, columnName]
  )

  // Load options when popover opens (only first time)
  React.useEffect(() => {
    if (open && !hasLoadedOnce) {
      fetchOptions('', 0)
    }
  }, [open, hasLoadedOnce, fetchOptions])

  // Reload options when search changes
  React.useEffect(() => {
    if (open && hasLoadedOnce) {
      setOffset(0)
      fetchOptions(debouncedSearch, 0)
    }
  }, [debouncedSearch, fetchOptions, open, hasLoadedOnce])

  // Load more options (infinite scroll)
  const loadMore = React.useCallback(() => {
    if (isLoading || options.length >= totalCount) return

    const newOffset = offset + LIMIT
    setOffset(newOffset)
    fetchOptions(debouncedSearch, newOffset, true)
  }, [isLoading, options.length, totalCount, offset, debouncedSearch, fetchOptions])

  // Find selected option from loaded options
  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value)
  }, [options, value])

  // Get display label for trigger button
  const displayLabel = React.useMemo(() => {
    if (value === null || value === undefined) {
      return placeholder
    }

    if (selectedOption) {
      return selectedOption.label
    }

    // Value exists but not loaded yet (show the raw value)
    return String(value)
  }, [value, selectedOption, placeholder])

  const handleSelect = (selectedValue: string | number | null) => {
    onChange(selectedValue)
    setOpen(false)
    setSearch('') // Reset search when selecting
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const retry = () => {
    setOffset(0)
    fetchOptions(debouncedSearch, 0)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value !== null && nullable && !disabled && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${tableName}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {/* Loading state */}
            {isLoading && !options.length && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-destructive text-center mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retry}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty state (no results) */}
            {!isLoading && !error && options.length === 0 && hasLoadedOnce && (
              <CommandEmpty>
                {search ? 'No results found.' : 'No options available.'}
              </CommandEmpty>
            )}

            {/* Options list */}
            {!error && options.length > 0 && (
              <CommandGroup>
                {/* Nullable option (None) */}
                {nullable && (
                  <CommandItem
                    value="__null__"
                    onSelect={() => handleSelect(null)}
                    className="text-muted-foreground italic"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === null ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    None (optional)
                  </CommandItem>
                )}

                {/* Data options */}
                {options.map((option) => (
                  <CommandItem
                    key={String(option.value)}
                    value={String(option.value)}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.metadata && (
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          {option.metadata}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}

                {/* Load more button */}
                {options.length < totalCount && (
                  <div className="flex items-center justify-center py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load more (${options.length} of ${totalCount})`
                      )}
                    </Button>
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
