'use client';
/**
 * @fileoverview Context menu for graph node actions.
 * Exports: GraphContextMenu
 */

import React from 'react';

export type GraphContextMenuState = {
  nodeId: string;
  x: number;
  y: number;
};

interface GraphContextMenuProps {
  contextMenu: GraphContextMenuState | null;
  pinnedNodes: Record<string, boolean>;
  clusters: Record<string, string>;
  isClusterCollapsed: (clusterId?: string) => boolean;
  onTogglePin: (nodeId: string) => void;
  onToggleCluster: (clusterId: string) => void;
  onCollapseNode: (nodeId: string) => void;
  onExpandNode: (nodeId: string) => void;
  onClose: () => void;
}

const GraphContextMenu: React.FC<GraphContextMenuProps> = ({
  contextMenu,
  pinnedNodes,
  clusters,
  isClusterCollapsed,
  onTogglePin,
  onToggleCluster,
  onCollapseNode,
  onExpandNode,
  onClose,
}) => {
  if (!contextMenu) return null;

  const clusterId = clusters[contextMenu.nodeId];

  return (
    <div
      className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <div
        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onTogglePin(contextMenu.nodeId);
          onClose();
        }}
      >
        {pinnedNodes[contextMenu.nodeId] ? 'Unpin' : 'Pin'}
      </div>
      {clusterId && (
        <>
          <div className="-mx-1 my-1 h-px bg-border" />
          <div
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onToggleCluster(clusterId);
              onClose();
            }}
          >
            {isClusterCollapsed(clusterId) ? 'Expand Cluster' : 'Collapse Cluster'}
          </div>
        </>
      )}
      <div className="-mx-1 my-1 h-px bg-border" />
      <div
        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onCollapseNode(contextMenu.nodeId);
          onClose();
        }}
      >
        Collapse Node
      </div>
      <div
        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onExpandNode(contextMenu.nodeId);
          onClose();
        }}
      >
        Expand Node
      </div>
    </div>
  );
};

export default GraphContextMenu;
