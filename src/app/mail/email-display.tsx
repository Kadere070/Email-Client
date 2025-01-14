'use client'
import Avatar from 'react-avatar';
import { Letter } from 'react-letter';
import { api, type RouterOutputs } from '@/trpc/react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import useThreads from '@/app/mail/use-threads';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Props = {
    email: RouterOutputs['account']['getThreads'][number]['emails'][number]
}

const EmailDisplay = ({ email }: Props) => {
    const { account } = useThreads()
    const letterRef = React.useRef<HTMLDivElement>(null);


    React.useEffect(() => {
        if (letterRef.current) {
            const gmailQuote = letterRef.current.querySelector('div[class*="_gmail_quote"]');
            if (gmailQuote) {
                gmailQuote.innerHTML = '';
            }
        }
    }, [email]);

    const isMe = account?.emailAddress === email.from.address
    // determining who sent the email and/or if I am the sender
    return (
        <div className={cn('border rounded-md p-4 cursor-pointer transition-all  hover:translate-x-2', {
            'border-l-gray-900 border-l-4': isMe
        })} ref={letterRef}>
            <div className="flex items-center justify-between gap-2">
                <div className='flex items-center gap-2'>

                    {/* if it is not me, show an avatar */}
                    {!isMe && <Avatar name={email.from.name ?? email.from.address} email={email.from.address} size='35' textSizeRatio={2} round={true} />}
                    <span className='font-medium'>

                        {/*If it's me, show "Me"*/}
                        {isMe ? 'Me' : email.from.address}
                    </span>
                </div>

                {/* show the date the email was sent */}
                <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(email.sentAt ?? new Date(), {
                        addSuffix: true,
                    })}
                </p>
            </div>

            {/* show the email content */}
            <div className="h-4"></div>
            <Letter className='bg-white rounded-md text-black' html={email?.body ?? ""} />
        </div>
    )
}

export default EmailDisplay