'use client'

/**
 * Schema Statistics Component
 * Displays database-wide statistics including size, table count, and largest tables
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Table2, HardDrive, BarChart3 } from 'lucide-react'
import type { DatabaseStatistics } from '@/app/actions/schema/schema-actions'

interface SchemaStatisticsProps {
  statistics: DatabaseStatistics
}

export function SchemaStatistics({ statistics }: SchemaStatisticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Database Size */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            Database Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalSize}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Data: {statistics.dataToIndexRatio.toFixed(1)}x indexes
          </div>
        </CardContent>
      </Card>

      {/* Total Tables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Table2 className="h-4 w-4 text-muted-foreground" />
            Total Tables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalTables.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {statistics.totalIndexes.toLocaleString()} indexes
          </div>
        </CardContent>
      </Card>

      {/* Total Rows */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Total Rows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.totalRowsEstimate.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Estimated count</div>
        </CardContent>
      </Card>

      {/* Largest Tables */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Largest Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statistics.largestTables.length > 0 ? (
            <>
              <div className="text-2xl font-bold">{statistics.largestTables[0].totalSize}</div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {statistics.largestTables[0].tableName}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Largest Tables List - Full Width */}
      {statistics.largestTables.length > 0 && (
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top 5 Largest Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.largestTables.slice(0, 5).map((table, index) => (
                <div
                  key={table.tableName}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs font-mono flex-shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium truncate">
                        {table.tableName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {table.schemaName} • {table.rowCountEstimate.toLocaleString()} rows
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{table.totalSize}</div>
                      <div className="text-xs text-muted-foreground">
                        Data: {table.tableSize} • Index: {table.indexesSize}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
