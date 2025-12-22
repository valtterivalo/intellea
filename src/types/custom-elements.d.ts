/**
 * @fileoverview JSX custom element types for intellea graph components.
 */

import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'intellea-graph': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        data?: string;
      };
    }
  }
}
