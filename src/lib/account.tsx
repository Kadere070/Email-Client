
import axios from "axios";
import type { EmailHeader, EmailMessage,  SyncResponse, SyncUpdatedResponse } from '@/types';
import { db } from '@/server/db';
import { syncEmailsToDatabase } from './sync-to-db';

export class Account {
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

    async getUpdatedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}): Promise<SyncUpdatedResponse> {
        let params: Record<string, string> = {}
        if (deltaToken) params['deltaToken'] = deltaToken
        if (pageToken) params['pageToken'] = pageToken

        const response = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated', {
            headers: {
                Authorization: `Bearer ${this.token}`,
            }, 
            params
        })

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

}         



