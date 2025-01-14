'use server'

import{auth} from '@clerk/nextjs/server'
import axios from 'axios' // makes http requests

export const getAurinkoAuthUrl = async (serviceType: 'Google'| 'Office365') => {

    // getting logged in user

    const   {userId} =await auth()  // auth() is a function from clerk

    // not logged in user

    if (!userId) throw new Error("Unauthorized")

        const params= new URLSearchParams({
            clientId: process.env.AURINKO_CLIENT_ID as string,
            serviceType,
            scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
            responseType: 'code',
            returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`  // routes to this callback whenever aurinko gives back a token
            
        })
    
    // Hitting the actual API

    return 'https://api.aurinko.io/v1/auth/authorize?' + params.toString() 

}
 
export const getAurinkoToken = async (code: string) => {
   try {

    // the endpoint URL from aurinko docs
    const response = await axios.post('https://api.aurinko.io/v1/auth/token',{}, {
        auth: { 
            // authentication credentials
            username: process.env.AURINKO_CLIENT_ID as string,
            password: process.env.AURINKO_CLIENT_SECRET as string
        }
    })
    return response.data as{
        accountId: number,
        accessToken: string,
        userId: string,
        userSession: string
    }
   } catch (error) {
            if (axios.isAxiosError(error)) {
                // log out the data
                console.error(error.response?.data); 
            }
            console.error(error);
   }

}


// function for getting token in exchange for account details
export const getAccountDetails= async (accessToken: string) => {
    try {
        const response = await axios.get('https://api.aurinko.io/v1/account', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
        return response.data as {
            email: string
            name: string
        }
    }catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error  fetching account details',error.response?.data);
        } else{
            console.error('Unexpected error  fetching account details',error);

        }
        throw error;
    }

} 
        