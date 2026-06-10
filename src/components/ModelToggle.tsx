import React from 'react'
import { Zap } from 'lucide-react'

interface ModelToggleProps {
  model: 'flash' | 'pro'
  onChange: (model: 'flash' | 'pro') => void
  disabled?: boolean
}

const ModelToggle: React.FC<ModelToggleProps> = ({ disabled }) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Engine</p>
      <div className="flex items-center bg-gray-950 border border-gray-800 rounded-2xl p-1 w-fit">
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary-300 bg-primary-600/20 border border-primary-700/40">
          <Zap className="w-3.5 h-3.5" />
          OpenRouter AI
          <span className="ml-0.5 text-[9px] bg-primary-700/40 border border-primary-700/30 text-primary-400 px-1.5 py-0.5 rounded-full">
            Active
          </span>
        </span>
      </div>
      <p className="text-[10px] text-gray-600 font-mono max-w-xs">
        ⚡ Free-tier · No quota limits · Powered by OpenRouter
      </p>
    </div>
  )
}

export default ModelToggle
