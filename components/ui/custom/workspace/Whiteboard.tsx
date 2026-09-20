"use client"
import React,{useRef,useState} from "react";
import "@excalidraw/excalidraw/index.css"
import {
  Excalidraw,
} from "@excalidraw/excalidraw";
import { useParams } from "next/navigation";
import { toast } from "../../toast";


function Whiteboard() {
     const [excalidrawAPI, setExcalidRawAPI] = useState(null);
     const  savetimeRef = useRef<any>(null);
    const { projectId } = useParams<{ projectId: string }>();

      const handleCanvasChange=(elements:readonly any[],appState:any ,files:any)=>{
        // cancel 
        if(savetimeRef?.current){
            clearTimeout(savetimeRef.current)
        }

        // start 10 sec
        savetimeRef.current=setTimeout(() =>{
            //save mathod 
              SaveCanvasChanges(elements ,appState ,files);
              toast.add({
                title:'changes save',
                type:'success'
              })
              
        },10000)
      }


      const SaveCanvasChanges = async (elements:readonly any[],appState:any ,files:any) => {
           await fetch('/api/whiteboard', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
                 elements:elements,
                 appState:appState,
                 files:files,
             projectId
             }),
           })
      }

       


  return (
     <div style={{ height: "calc(100vh - 88px)", width: "100%" }}>
        <Excalidraw 
              onChange={handleCanvasChange}
        />
              
      </div>
  )
}

export default Whiteboard
