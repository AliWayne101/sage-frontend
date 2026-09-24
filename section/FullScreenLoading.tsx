import React from 'react'

const FullScreenLoading = () => {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-white uppercase tracking-widest">Processing Records...</p>
        </div>
    )
}

export default FullScreenLoading