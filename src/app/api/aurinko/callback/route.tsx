import { getAurinkoToken, getAccountDetails } from '@/lib/aurinko'
import {auth} from '@clerk/nextjs/server'
import {type NextRequest, NextResponse} from 'next/server'
import {db} from '@/server/db'
import { waitUntil } from '@vercel/functions'
import axios from 'axios'



export const GET= async (req: NextRequest) => {
    const {userId} = await auth()

    // If no userID
    if (!userId) return NextResponse.json({message: 'unauthorized'}), {status: 401}
    
    const params= req.nextUrl.searchParams
    const status=params.get('status')

    // if no status
    if (status !== 'success') return NextResponse.json({error: 'Failed to link account'}), {status: 400}

    // getting the code for auth token exchange 
    const code=params.get('code')


    // if code
    const token= await getAurinkoToken(code as string)

    // If no code
    //if (!code) return NextResponse.json({message: 'No code provided'}), {status: 400}
    
    // if no token
    if (!token) return NextResponse.json({error: 'Failed to exchange access token code'}), {status: 400}
  

    const accountDetails= await getAccountDetails(token.accessToken)

    // saving to the DB from 'model account' in schema
    // upsert(update & insert) if the record exist, update. If no record add
    await db.account.upsert({
        where: {
            id: token.accountId.toString()
        },      
        create: {
            id: token.accountId.toString(),
            userId,
            token: token.accessToken,
            provider: 'Aurinko',
            emailAddress: accountDetails.email,
            name: accountDetails.name
            
        }, 
        update:{
            token: token.accessToken,
        }
    })

    // trigger initial snyc endpoint
    waitUntil (
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`,{
            accountId: token.accountId.toString(),
            userId,
        }).then(response => {
            console.log("Initial sync triggered",response.data)
        }).catch(error => {
            console.error("Error triggering initial sync",error.response.data)
        })
    )


    return NextResponse.redirect(new URL('/mail', req.url))

}