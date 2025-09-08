"use client"

import { Suspense } from "react"
import VerifyRequestContent from "./VerifyRequestContent"

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<p className="text-center">Loading...</p>}>
      <VerifyRequestContent />
    </Suspense>
  )
}
