"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Chart configuration type
export type ChartConfig = {
  [key: string]: {
    label: string
    color: string
  }
}

// Chart container component
export function ChartContainer({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  )
}

// Chart tooltip component
export function ChartTooltip({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  )
}

// Chart tooltip content component
export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  ...props
}: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: string | number }>
  label?: string
  className?: string
  hideLabel?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  if (active && payload && payload.length) {
    return (
      <div className={cn("rounded-lg border bg-background p-2 shadow-md", className)} {...props}>
        {!hideLabel && <div className="grid grid-cols-2 gap-2">{label}</div>}
        <div className="grid grid-cols-1 gap-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.name}:</span>
              <span className="text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}
