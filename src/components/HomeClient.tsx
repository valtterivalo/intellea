'use client';
/**
 * @fileoverview React component.
 * Exports: HomeClient
 */

import React from 'react';
import MainAppClient from '@/components/MainAppClient';

export default function HomeClient() {
  return (
    <div className="flex flex-col min-h-screen">
      <MainAppClient />
    </div>
  );
} 