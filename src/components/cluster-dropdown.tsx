'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCluster } from '@/features/cluster/cluster-context'

export function ClusterDropdown() {
  const { cluster, clusters, setCluster } = useCluster()

  if (!cluster) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="capitalize">
          {cluster.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup
          value={cluster.name}
          onValueChange={(value) => setCluster(value as any)}
        >
          {clusters.map((c) => (
            <DropdownMenuRadioItem key={c.name} value={c.name} className="capitalize">
              {c.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}