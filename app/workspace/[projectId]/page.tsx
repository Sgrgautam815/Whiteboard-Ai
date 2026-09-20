"use client"
import WorksoaceHeader from '@/components/ui/custom/workspace/WorksoaceHeader';
import Whiteboard from '@/components/ui/custom/workspace/Whiteboard';
import { useState } from 'react'

function Workspace() {
  const [activeTab, setActiveTab] = useState('whiteBoard')

  return (
    <div>
      <div>
        <WorksoaceHeader selectedTab={(value:string)=> setActiveTab(value)}/>
            {activeTab === "whiteBoard" ?
            <Whiteboard /> : <div>Doc</div>
            
        }

      </div>
    </div>
  )
}

export default Workspace
