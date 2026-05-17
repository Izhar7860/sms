import React from 'react'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    </div>
  )
}

