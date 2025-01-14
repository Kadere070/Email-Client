import {api} from '@/trpc/react'
import { useLocalStorage } from 'usehooks-ts'
import { getQueryKey } from '@trpc/react-query'
import React from 'react'
import {atom, useAtom} from 'jotai'

export const threadIdAtom = atom<string | null>(null)

const useThreads = () => {
    const {data: accounts}=api.account.getAccounts.useQuery()
    const [accountId] = useLocalStorage('accountId', '')
    const [tab] = useLocalStorage('EasyMail-tab', 'inbox')
    const [done]=useLocalStorage('done', false)
    const queryKey = getQueryKey(api.account.getThreads, { accountId, tab, done }, 'query')
    const [threadID, setThreadID] = useAtom(threadIdAtom)
    
    const {data: threads, isFetching, refetch}=api.account.getThreads.useQuery({
        accountId,
        tab,
        done
    }, { enabled: !!accountId && !!tab, placeholderData: (e:any) =>e, refetchInterval: 5000 })
    return {
        threads,
        isFetching,
        refetch, 
        accountId,
        account: accounts?.find((account:any) => account.id === accountId),
        queryKey,
        threadID,
        setThreadID
    }
}

export default useThreads