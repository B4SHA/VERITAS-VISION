"use client";

import React, { Suspense } from 'react';
import Loading from '@/app/loading';

export function PageWrapper({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
