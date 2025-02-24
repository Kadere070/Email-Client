
import axios from "axios";
import type { EmailHeader, EmailMessage,  SyncResponse, SyncUpdatedResponse } from '@/lib/types';
import { db } from '@/server/db';
import { syncEmailsToDatabase } from './sync-to-db';
import { EmailAddress } from "@/lib/types";

const API_BASE_URL = 'https://api.aurinko.io/v1';

 class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync() {
        const response = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync', {
            headers: {
                Authorization: `Bearer ${this.token}`,
            }, 
            params: {
                daysWithin: 30, // syncing according to the desired amount of days
                bodyType: 'html'
            }            
        })

        return response.data;
    }

    async syncEmails() {
        const account = await db.account.findUnique({
            where: {
                token: this.token
            },
        })
        if (!account) throw new Error("Invalid token")
        if (!account.nextDeltaToken) throw new Error("No delta token")
        let response = await this.getUpdatedEmails({ deltaToken: account.nextDeltaToken })
        let allEmails: EmailMessage[] = response.records
        let storedDeltaToken = account.nextDeltaToken
        if (response.nextDeltaToken) {
            storedDeltaToken = response.nextDeltaToken
        }
        while (response.nextPageToken) {
            response = await this.getUpdatedEmails({ pageToken: response.nextPageToken });
            allEmails = allEmails.concat(response.records);
            if (response.nextDeltaToken) {
                storedDeltaToken = response.nextDeltaToken
            }
        }

        if (!response) throw new Error("Failed to sync emails")


        try {
            await syncEmailsToDatabase(allEmails, account.id)
        } catch (error) {
            console.log('error', error)
        }

        // console.log('syncEmails', response)
        await db.account.update({
            where: {
                id: account.id,
            },
            data: {
                nextDeltaToken: storedDeltaToken,
            }
        })
    }


    async getUpdatedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}): Promise<SyncUpdatedResponse> {
        let params: Record<string, string> = {}
        if (deltaToken) {
            params['deltaToken'] = deltaToken
        }
        if (pageToken) {
            params['pageToken'] = pageToken
        }

        const response = await axios.get<SyncUpdatedResponse>('${API_BASE_URL}/email/sync/updated', 
            {
                params,
                headers: {
                    Authorization: `Bearer ${this.token}`
                }, 
            }
        )

        return response.data
    }


    async performInitialSync() {
        try{
            // start syncing
            
            let syncResponse= await this.startSync()

            // while the sync is not ready      
            while (!syncResponse.ready) {
                await new Promise(resolve=> setTimeout(resolve, 1000)); // wait for 1 second    
                syncResponse= await this.startSync()
            }

            // get the bookmark delta token
            let storedDeltaToken: string = syncResponse.syncUpdatedToken

            let updatedResponse= await this.getUpdatedEmails( {deltaToken: syncResponse.syncUpdatedToken})

            if  (updatedResponse.nextPageToken) {

                // sync completed
                storedDeltaToken= updatedResponse.nextDeltaToken 
            }
            let allEmails: EmailMessage[] = updatedResponse.records;

            // Fetching all pages if there are more
            while (updatedResponse.nextPageToken) {
                updatedResponse= await this.getUpdatedEmails({pageToken: updatedResponse.nextPageToken})
                allEmails=allEmails.concat(updatedResponse.records)
                if (updatedResponse.nextPageToken) {
                    storedDeltaToken= updatedResponse.nextDeltaToken
                }
            }

            console.log('Initial sync completed, we have synced', allEmails.length, 'emails')

            // storing the latest delta token for future incremental syncs
            return {
                emails: allEmails,
                deltaToken: storedDeltaToken,
            }
            
        } catch (error:any) {
            if (axios.isAxiosError(error)) {
                console.error('Error syncing emails', JSON.stringify(error.response?.data,null,2))
            } else {
                console.error('Unexpected error syncing emails', error);
            }
        }
        
    }

    async sendEmail({
        from,
        subject,
        body,
        inReplyTo,
        references,
        threadId,
        to,
        cc,
        bcc,
        replyTo,
    }: {
        from: EmailAddress;
        subject: string;
        body: string;
        inReplyTo?: string;
        references?: string;
        threadId?: string;
        to: EmailAddress[];
        cc?: EmailAddress[];
        bcc?: EmailAddress[];
        replyTo?: EmailAddress;
    }) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/email/messages`,
                {
                    from,
                    subject,
                    body,
                    inReplyTo,
                    references,
                    threadId,
                    to,
                    cc,
                    bcc,
                    replyTo: [replyTo],
                },
                {
                    params: {
                        returnIds: true
                    },
                    headers: { Authorization: `Bearer ${this.token}` }
                }
            );

            console.log('sendmail', response.data)
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error sending email:', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.error('Error sending email:', error);
            }
            throw error;
        }
    }

}         

export default Account;

