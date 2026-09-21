"use client"
import WorksoaceHeader from '@/components/ui/custom/workspace/WorksoaceHeader';
import Whiteboard from '@/components/ui/custom/workspace/Whiteboard';
import { useState } from 'react'
import { exportToBlob } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

function Workspace() {
  const [activeTab, setActiveTab] = useState('whiteBoard')
  const [api, setApi]=useState<ExcalidrawImperativeAPI|null>(null)



  const handleExportImage=async()=>{
    if(!api) return;

    const blob=await exportToBlob({
        elements:api.getSceneElements(),
        appState:{
            ...api.getAppState(),
            exportBackground:true
        },
        files:api.getFiles(),
        mimeType:"image/png",
        quality:1
    });

    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download='whiteboard.png'
    link.click();

    URL.revokeObjectURL(url);


  }



  return (
    <div>
      <div>
        <WorksoaceHeader selectedTab={(value:string)=> setActiveTab(value)}
            onExport={()=>handleExportImage()}
            />
        
            {activeTab === "whiteBoard" ?
            <Whiteboard 
            
            
            onApiReady={(api)=>setApi(api)}
            /> : <div className="p-6">Smart document</div>
            
        }

      </div>
    </div>
  )
}

export default Workspace
