'use client'

import { Button } from '@/components/ui/button'
import React from 'react'
import { getAurinkoAuthUrl } from '@/lib/aurinko'

const linkAccountButton = () => {
    return (
        <Button onClick={async ()=>{
            const authUrl = await getAurinkoAuthUrl('Google');
            //console.log(authUrl)
            window.location.href = authUrl
        }}>
            Link Account
        </Button>
    )
}

export default linkAccountButton

