import { allPRs } from "@/lib/api/allPRs";
import { useState, useEffect } from "react";

type PR = {
  id: string
  prNumber: number
  prTitle: string | null
  summary: string | null
  createdAt: string
}

export function useAllPRs(repoId: string) {
    const [prs, setPRs] = useState<PR[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        allPRs(repoId).then(setPRs).catch((e)=>{console.log(e)}).finally(()=>setLoading(false))
    },[repoId])

    return { loading, prs }
}