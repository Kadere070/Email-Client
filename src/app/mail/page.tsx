'use client'

import React from "react";
//import Mail from "./mail";
import dynamic from "next/dynamic";

const Mail = dynamic(() => import("./mail"), { ssr: false });

const MailDashboard = () => {
    return (
        <Mail
            defaultlayout={[20, 32, 48]}
            navCollapsedSize={50}
            defaultCollapsed={false}
        />
    )
};      

export default MailDashboard;

