"use client"

import { useEffect } from "react"


export default function Testt() {
    useEffect(() => {
        console.log('client URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    }, [])

    
    return (
        <h1>
            HI
        </h1>
    )
}