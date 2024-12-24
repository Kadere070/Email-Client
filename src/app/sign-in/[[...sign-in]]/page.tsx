import {SignIn } from '@clerk/nextjs'
import { LucideAlignHorizontalDistributeCenter } from 'lucide-react';
import React from 'react';

export default function Page() {
    return (
        <div className="flex items-center justify-center h-screen"><SignIn /></div>
    )
    
}