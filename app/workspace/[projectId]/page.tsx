"use client"
import WorksoaceHeader from '@/components/ui/custom/workspace/WorksoaceHeader';
import Whiteboard from "@/components/ui/custom/workspace/Whiteboard";
import { useEffect, useState } from 'react'
import { exportToBlob } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useParams } from 'next/navigation';
import axios from 'axios'

function normalizeAppState(savedAppState: any, currentAppState: any) {
  const savedCollaborators = savedAppState?.collaborators;
  const collaborators = savedCollaborators instanceof Map
    ? savedCollaborators
    : Array.isArray(savedCollaborators)
      ? new Map(savedCollaborators)
      : new Map();

  return {
    ...currentAppState,
    ...(savedAppState || {}),
    collaborators,
  };
}

function Workspace() {
  const [activeTab, setActiveTab] = useState('whiteBoard')
  const [api, setApi]=useState<ExcalidrawImperativeAPI|null>(null)
  const [projectName, setprojectName]=useState('')

  const { projectId } = useParams<{ projectId: string }>();

  useEffect(()=>{
          projectId&&api && GetWhiteboardData();
        },[projectId,api])



 const GetWhiteboardData=async()=>{
        try{
            const result =await axios.get(
             '/api/projects?projectId='+projectId
            );
       
                console.log("whiteboard Data:",result.data);
                setprojectName(result?.data?.projectName)

            api?.updateScene({
            elements:result.data.elements || [],
                appState: normalizeAppState(result.data.appState, api.getAppState()),
            })

             if(result.data.files){
            api?.addFiles(
                 Object.values(result.data.files)
            )
           }
        }

        catch(error){
        console.error("Failed to lead Whiteboard:",error);
        }
     
    }

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
            projectName={projectName}
            />
        
            {activeTab === "whiteBoard" ?
            <Whiteboard 
            
            
            onApiReady={(api: ExcalidrawImperativeAPI)=>setApi(api)}
            /> : <div className="p-6">Smart document</div>
            
        }

      </div>
    </div>
  )
}

export default Workspace
