"use client"

import React from "react";
import {ResizablePanelGroup, ResizableHandle, ResizablePanel} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Separator } from "@radix-ui/react-context-menu";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSwitcher } from "@/app/mail/account-switcher"
import SideBar from "./sidebar"
import {ThreadList} from "./thread-list";
import { ThreadDisplay } from "./thread-display";
import SearchBar from "./search-bar";

// @ts-ignore
type Props = {
    defaultlayout: number[]| undefined
    navCollapsedSize: number
    defaultCollapsed: boolean
}

const Mail = ({
    defaultlayout=[20, 32, 48], 
    defaultCollapsed,
    navCollapsedSize}: Props) => {

    const [isCollapsed, setIsCollapsed] = React.useState(false)
    return (
        <TooltipProvider delayDuration={0}> 

            <ResizablePanelGroup

                

                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    console.log(sizes)

                }}className="items-stretch h-full min-h-screen">

                <ResizablePanel 
                 
                defaultSize={defaultlayout[0]} 
                collapsedSize={navCollapsedSize}
                collapsible={true}
                minSize={10}
                maxSize={20}
                onCollapse={() => {
                    setIsCollapsed(true)

                }}

                onResize={() => {
                    setIsCollapsed(false)
                }}
                className={cn (isCollapsed && ("min-w-[50px] transition-all duration-300 ease-in-out"))}>
                    <div className="flex flex-col h-full flex-1"> 
                        <div className={cn("flex h-[52px] items-center justify between", isCollapsed? 'h-[52px]': 'h-[52px]')}>
                            {/*Account Switcher*/}
                            <AccountSwitcher isCollapsed={isCollapsed} />
                        </div> 
                        <Separator/>
                    {/*Sidebar*/}
                    <SideBar isCollapsed={isCollapsed}/>

                    <div className="flex-1">    </div>
                    {/*AI*/}
                    Ask Aurix
                    </div>
                    
                </ResizablePanel>
                <ResizableHandle withHandle={false} />
                <ResizablePanel defaultSize={defaultlayout[1]} minSize={5}>
                    {/*Tabs*/}
                    <Tabs defaultValue="inbox">
                        <div className="flex items-center px-4 py-2"    >
                            <h1 className='text-x1 font-bold'>Inbox</h1>
                            <TabsList className="ml-auto">

                                {/*Tabs Triggers (Inbox, Done)*/}
                                <TabsTrigger value="inbox" className='text-xinc-600 dark:text-xinc-200'>
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger value="sent" className='text-xinc-600 dark:text-xinc-200'>
                                    Done   
                                </TabsTrigger>
                            </TabsList>
                        </div> 

                        <Separator/>    
                        {/*Search Bar*/}
                        <SearchBar/>

                        {/*Thread List*/}
                        <TabsContent value="inbox">
                            <ThreadList/>
                        </TabsContent>
                        <TabsContent value="done">
                            <ThreadList/>
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>


                <ResizableHandle withHandle/>
                <ResizablePanel defaultSize={defaultlayout[2]} minSize={15}>
                    <ThreadDisplay/>
                </ResizablePanel>


            </ResizablePanelGroup>
        </TooltipProvider>       
    )
}

export default Mail