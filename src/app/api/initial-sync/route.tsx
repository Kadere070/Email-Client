//api/initial-sync

import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";


export const POST = async (req: NextRequest) => {
    const {accountId, userId} = await req.json()

    // if no account id or user id
    if (!accountId || !userId){
        return new Response('Missing account id or user id', {status: 400})
    }

    // if account id or user id, search for the user in DB
    const dbAccount = await db.account.findUnique({
        where: {
            id: accountId,
            userId
        }   
    })

    // if no user
    if (! dbAccount) return NextResponse.json({message: 'User not found'}, {status: 404})

    const account= new Account(dbAccount.token)

    // perform initial sync
    const response= await account.performInitialSync()

    // If there is no response
    if (!response){
        return NextResponse.json({error: 'Failed to perform initial sync'}, {status: 500})
    }
    // if response, writing to the DB
    const {emails, deltaToken} = response

    await syncEmailsToDatabase (emails, accountId)

    await db.account.update({
        where: {
            id: accountId
        },
        data: {
            nextDeltaToken: deltaToken
        }
    })

   
    console.log('Emails synced', deltaToken)
    return NextResponse.json({success:true}, {status: 200})

}
