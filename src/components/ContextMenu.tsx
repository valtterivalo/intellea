"use client"

import * as React from "react"
import * as CM from "@radix-ui/react-context-menu"

import { cn } from "@/lib/utils"

const ContextMenu = CM.Root
const ContextMenuTrigger = CM.Trigger

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof CM.Content>,
  React.ComponentPropsWithoutRef<typeof CM.Content>
>(({ className, ...props }, ref) => (
  <CM.Content
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
))
ContextMenuContent.displayName = CM.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof CM.Item>,
  React.ComponentPropsWithoutRef<typeof CM.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <CM.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = CM.Item.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof CM.Separator>,
  React.ComponentPropsWithoutRef<typeof CM.Separator>
>(({ className, ...props }, ref) => (
  <CM.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
))
ContextMenuSeparator.displayName = CM.Separator.displayName

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
}
