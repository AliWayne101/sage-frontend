import { ExternalLink } from 'lucide-react'
import React from 'react'

const Footer = () => {
    return (
        <footer className="w-full border-t border-[#27272a] bg-[#0c0c0e]/80 backdrop-blur py-4 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                    <span>Sage Trading Terminal</span>
                    <span className="text-zinc-600">•</span>
                    <span>Developed by</span>
                    <a
                        href="https://waynedev.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-200 hover:text-purple-400 font-semibold inline-flex items-center gap-1 transition-colors underline decoration-zinc-700 underline-offset-4 hover:decoration-purple-400"
                    >
                        <span>Wayne Development</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                    <span>&copy; {new Date().getFullYear()} SAGE. All rights reserved.</span>
                </div>
            </div>
        </footer>
    )
}

export default Footer