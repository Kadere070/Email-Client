import type { SyncUpdatedResponse, EmailMessage, EmailAddress, EmailAttachment, EmailHeader } from '@/types';
import pLimit from 'p-limit';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
//import { OramaManager } from './orama';
//import { getEmbeddings } from './embeddings';
//import { turndown } from './turndown';


export async function syncEmailsToDatabase(emails:EmailMessage[], accountId: string) {
    // TODO
    console.log('attempting to sync emails to database', emails.length);
    const limit = pLimit(10); // limit to 10 requests at a time
    
    try     {
       // Promise.all(emails.map((email, index)=>upsertEmail(email, accountId, index)))
       for (const email of emails) {
            await upsertEmail(email, accountId, 0);
       }
    }
    catch (error) {
        console.error('Error syncing emails to database', error);
    }
}

async function upsertEmail(email: EmailMessage, accountId: string, index: number) {
    // TODO
    console.log('attempting to upsert email to database', index)
    try         {
        // defining email label
        let emailLabelType: 'inbox' | 'flagged' | 'trash' | 'draft' | 'sent' = 'inbox'
        if  (email.sysLabels.includes('inbox')){
            emailLabelType = 'inbox'
        }            
       // else if (email.sysLabels.includes('flagged')){
            //emailLabelType = 'flagged'
       // }           
       // else if (email.sysLabels.includes('trash')){
           // emailLabelType = 'trash'
      //  } 
        else if (email.sysLabels.includes('draft')){ 
            emailLabelType = 'draft'
        }
        else if (email.sysLabels.includes('sent')){
            emailLabelType = 'sent'   
        }

        // (name: string, email: string, emailLabelType: 'inbox' | 'spam' | 'trash' | 'drafts' | 'sent')
        // Upsert EmailAddress records
        const addressesToUpsert=new Map()
        for (const address of [email.from, ...email.to, ...email.cc, ...email.bcc, ...email.replyTo]) {
            addressesToUpsert.set(address.address, address)

        }

        const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>>|null) []=[];


        for (const address of addressesToUpsert.values()) {
            const upsertedAddress= await upsertEmailAddress(address, accountId)
            upsertedAddresses.push(upsertedAddress);
        }

        const addressMap = new Map(
            upsertedAddresses.filter(Boolean).map(address => [address!.address, address]))
        

        const fromAddress = addressMap.get(email.from.address);
        if (!fromAddress) {
            console.log('Failed to upsert from address for email ${email.bodySnippet}');
            return;
        }

        const toAddresses = email.to.map(addr=> addressMap.get(addr.address)).filter((Boolean));
        const ccAddresses = email.cc.map(addr=> addressMap.get(addr.address)).filter((Boolean));
        const bccAddresses = email.bcc.map(addr=> addressMap.get(addr.address)).filter((Boolean));
        const replyToAddresses = email.replyTo.map(addr=> addressMap.get(addr.address)).filter((Boolean));

          // 2. Upsert Thread
          const thread = await db.thread.upsert({
            where: { id: email.threadId },
            update: {
                subject: email.subject,
                accountId,
                lastMessageDate: new Date(email.sentAt),
                done: false,
                participantIds: [...new Set([
                    fromAddress.id,
                    ...toAddresses.map(a => a!.id),
                    ...ccAddresses.map(a => a!.id),
                    ...bccAddresses.map(a => a!.id)
                ])]
            },
            create: {
                id: email.threadId,
                accountId,
                subject: email.subject,
                done: false,
                draftStatus: emailLabelType === 'draft',
                inboxStatus: emailLabelType === 'inbox',
                sentStatus: emailLabelType === 'sent',
                //flaggedStatus: emailLabelType === 'flagged',
                lastMessageDate: new Date(email.sentAt),
                participantIds: [...new Set([
                    fromAddress.id,
                    ...toAddresses.map(a => a!.id),
                    ...ccAddresses.map(a => a!.id),
                    ...bccAddresses.map(a => a!.id)
                ])]
            }
        });

         
        // 3. Upsert Email
        await db.email.upsert({
            where: { id: email.id },
            update: {
                threadId: thread.id,
                createdTime: new Date(email.createdTime),
                lastModifiedTime: new Date(),
                sentAt: new Date(email.sentAt),
                receivedAt: new Date(email.receivedAt),
                internetMessageId: email.internetMessageId,
                subject: email.subject,
                sysLabels: email.sysLabels,
                keywords: email.keywords,
                sysClassifications: email.sysClassifications,
                sensitivity: email.sensitivity,
                meetingMessageMethod: email.meetingMessageMethod,
                fromId: fromAddress.id,
                to: { set: toAddresses.map(a => ({ id: a!.id })) },
                cc: { set: ccAddresses.map(a => ({ id: a!.id })) },
                bcc: { set: bccAddresses.map(a => ({ id: a!.id })) },
                replyTo: { set: replyToAddresses.map(a => ({ id: a!.id })) },
                hasAttachments: email.hasAttachments,
                internetHeaders: email.internetHeaders as any,
                body: email.body,
                bodySnippet: email.bodySnippet,
                inReplyTo: email.inReplyTo,
                references: email.references,
                threadIndex: email.threadIndex,
                nativeProperties: email.nativeProperties as any,
                folderId: email.folderId,
                omitted: email.omitted,
                emailLabel: emailLabelType,
            },
            create: {
                id: email.id,
                emailLabel: emailLabelType,
                threadId: thread.id,
                createdTime: new Date(email.createdTime),
                lastModifiedTime: new Date(),
                sentAt: new Date(email.sentAt),
                receivedAt: new Date(email.receivedAt),
                internetMessageId: email.internetMessageId,
                subject: email.subject,
                sysLabels: email.sysLabels,
                internetHeaders: email.internetHeaders as any,
                keywords: email.keywords,
                sysClassifications: email.sysClassifications,
                sensitivity: email.sensitivity,
                meetingMessageMethod: email.meetingMessageMethod,
                fromId: fromAddress.id,
                to: { connect: toAddresses.map(a => ({ id: a!.id })) },
                cc: { connect: ccAddresses.map(a => ({ id: a!.id })) },
                bcc: { connect: bccAddresses.map(a => ({ id: a!.id })) },
                replyTo: { connect: replyToAddresses.map(a => ({ id: a!.id })) },
                hasAttachments: email.hasAttachments,
                body: email.body,
                bodySnippet: email.bodySnippet,
                inReplyTo: email.inReplyTo,
                references: email.references,
                threadIndex: email.threadIndex,
                nativeProperties: email.nativeProperties as any,
                folderId: email.folderId,
                omitted: email.omitted,
            }
        });

        const threadEmails = await db.email.findMany({
            where: { threadId: thread.id },
            orderBy: { receivedAt: 'asc' }
        });

        let threadFolderType = 'sent';
        for (const threadEmail of threadEmails) {
            if (threadEmail.emailLabel === 'inbox') {
                threadFolderType = 'inbox';
                break; // If any email is in inbox, the whole thread is in inbox

            } else if (threadEmail.emailLabel === 'draft') {
                threadFolderType = 'draft'; // Set to draft, but continue checking for inbox
            }
        }
        await db.thread.update({
            where: { id: thread.id },
            data: {
                draftStatus: threadFolderType === 'draft',
                inboxStatus: threadFolderType === 'inbox',
                sentStatus: threadFolderType === 'sent',
                //trashStatus: threadFolderType === 'trash',
                //flaggedStatus: threadFolderType === 'flagged',
            }
        });

        // 4. Upsert Attachments
        for (const attachment of email.attachments) {
            await upsertAttachment(email.id, attachment);
        }
    } 
    
    catch (error) {}
}

async function upsertEmailAddress(address: EmailAddress, accountId: string) {
    // TODO
    try{
        const existingAddress = await db.emailAddress.findUnique({
            where: {
                accountId_address: {
                    accountId,
                    address: address.address
                }   
            },
        });

        if (existingAddress) {
            return await db.emailAddress.update({
                where: {
                    id: existingAddress.id,
                },
                data: {
                    name: address.name,
                    raw: address.raw,
                },
            });
        } else {
            return await db.emailAddress.create({
                data: {
                    accountId,
                    address: address.address,
                    name: address.name,
                    raw: address.raw,
                },
            });
        }
    }    
    catch (error) {
        console.error('Error upserting address to database', error)
        return null
    }
}

async function upsertAttachment(emailId: string, attachment: EmailAttachment) {
    try {
        await db.emailAttachment.upsert({
            where: { id: attachment.id ?? "" },
            update: {
                name: attachment.name,
                mimeType: attachment.mimeType,
                size: attachment.size,
                inline: attachment.inline,
                contentId: attachment.contentId,
                content: attachment.content,
                contentLocation: attachment.contentLocation,
            },
            create: {
                id: attachment.id,
                emailId,
                name: attachment.name,
                mimeType: attachment.mimeType,
                size: attachment.size,
                inline: attachment.inline,
                contentId: attachment.contentId,
                content: attachment.content,
                contentLocation: attachment.contentLocation,
            },
        });
    } catch (error) {
        console.log(`Failed to upsert attachment for email ${emailId}: ${error}`);
    }
}