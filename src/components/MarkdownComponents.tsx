'use client';

import React from 'react';
import { Components } from 'react-markdown';

export const CustomParagraph = ({ children }: { children?: React.ReactNode }) => (
  <p className="leading-relaxed">{children}</p>
);

export const CustomH1 = ({ children }: { children?: React.ReactNode }) => (
  <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>
);

export const CustomH2 = ({ children }: { children?: React.ReactNode }) => (
  <h2 className="text-2xl font-semibold mt-5 mb-3">{children}</h2>
);

export const CustomH3 = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
);

export const markdownComponents: Components = {
  p: CustomParagraph,
  h1: CustomH1,
  h2: CustomH2,
  h3: CustomH3,
};

