'use client';
/**
 * @fileoverview Web component wrapper for GraphResponseRenderer.
 * Exports: GraphResponseElement, defineGraphResponseElement
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { GraphResponseV0 } from '@intellea/graph-schema';
import GraphResponseRenderer from '../components/GraphResponseRenderer';
import { graphRendererCss } from './graphRendererCss';

const DEFAULT_TAG_NAME = 'intellea-graph';
const BaseElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export class GraphResponseElement extends BaseElement {
  private root: Root | null = null;
  private container: HTMLDivElement | null = null;
  private graphResponseValue: GraphResponseV0 | null = null;

  static get observedAttributes(): string[] {
    return ['data'];
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = graphRendererCss;
      shadow.appendChild(style);

      const container = document.createElement('div');
      container.className = 'graph-root';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '320px';
      shadow.appendChild(container);

      this.container = container;
      this.root = createRoot(container);
    }

    this.renderContent();
  }

  disconnectedCallback(): void {
    const root = this.root;
    this.root = null;
    this.container = null;
    if (!root) return;
    queueMicrotask(() => {
      root.unmount();
    });
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== 'data' || oldValue === newValue) return;
    this.setGraphResponseFromAttribute(newValue);
  }

  set graphResponse(value: GraphResponseV0 | null) {
    this.graphResponseValue = value;
    this.renderContent();
  }

  get graphResponse(): GraphResponseV0 | null {
    return this.graphResponseValue;
  }

  private setGraphResponseFromAttribute(value: string | null): void {
    if (!value) {
      this.graphResponse = null;
      return;
    }
    const parsed = JSON.parse(value) as GraphResponseV0;
    if (parsed.version !== 'v0') {
      throw new Error(`Unsupported graph response version: ${parsed.version}`);
    }
    this.graphResponse = parsed;
  }

  private renderContent(): void {
    if (!this.root) return;

    if (!this.graphResponseValue) {
      this.root.render(
        <div className="w-full h-64 bg-muted flex items-center justify-center">
          <p className="text-muted-foreground italic text-sm">Waiting for graph data...</p>
        </div>
      );
      return;
    }

    this.root.render(<GraphResponseRenderer graphResponse={this.graphResponseValue} />);
  }
}

export const defineGraphResponseElement = (tagName: string = DEFAULT_TAG_NAME): void => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
  if (customElements.get(tagName)) return;
  customElements.define(tagName, GraphResponseElement);
};
