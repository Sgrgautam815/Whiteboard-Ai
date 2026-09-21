"use client"
import React,{useRef,useState} from "react";
import "@excalidraw/excalidraw/index.css"
import {
  Excalidraw,
} from "@excalidraw/excalidraw";
import { useParams } from "next/navigation";
import { ArrowRight, Circle, Diamond, Eraser, Hand, Image as ImageIcon, Minus, MousePointer2, Pencil, Square, Type } from "lucide-react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const tools =[{
    name:'selection',
    icon: MousePointer2,
    color : "text-blue-600"
    },
    {
    name:'hand',
    icon: Hand,
    color : "text-cyan-600"
    },
    {
    name:'rectangle',
    icon: Square,
    color : "text-blue-600"
    }
    ,
    {
    name:'diamond',
    icon: Diamond,
    color : "text-emerald-500"
    }
    ,
    {
    name:'ellipse',
    icon: Circle,
    color : "text-amber-600"
    }
    ,
    {
    name:'arrow',
    icon: ArrowRight,
    color : "text-blue-600"
    }
    ,
    {
    name:'line',
    icon: Minus,
    color : "text-blue-600"
    }
    ,
    {
    name:'freedraw',
    icon: Pencil,
    color : "text-blue-600"
    }
    ,
    {
    name:'eraser',
    icon: Eraser,
    color : "text-rose-600"
    }
    ,
    {
    name:"text",
    icon: Type,
    color : "text-blue-600"
    }
    ,
    {
    name:'image',
    icon: ImageIcon,
    color : "text-blue-600"
    }


]


function Whiteboard() {
     const [excalidrawAPI, setExcalidRawAPI] = useState<ExcalidrawImperativeAPI|null>(null);
     const  savetimeRef = useRef<any>(null);
    const { projectId } = useParams<{ projectId: string }>();
    const [activeTool,setActiveTool]=useState('selection');

      const handleCanvasChange=(elements:readonly any[],appState:any ,files:any)=>{
        // cancel 
        if(savetimeRef?.current){
            clearTimeout(savetimeRef.current)
        }

        // start 10 sec
        savetimeRef.current=setTimeout(() =>{
            // //save mathod 
            //   SaveCanvasChanges(elements ,appState ,files);
            //   toast.add({
            //     title:'changes save',
            //     type:'success'
            //   })
              
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

     const changeTool=(tool:any)=>{
        if(!excalidrawAPI) return ;

        setActiveTool(tool);
        excalidrawAPI.setActiveTool({
            type:tool
        })
      }


  return (
     <div style={{ height: "calc(100vh - 88px)", width: "100%" }}>
        <Excalidraw 
            excalidrawAPI={setExcalidRawAPI}
              onChange={handleCanvasChange}
        />
         <div className ='absolute left-4 top-1/2 z-50 -translate-y-1/2 
           flex flex-col gap-1
           rounded-2xl bg-white border p-1.5 shadow-xl'  >
          {tools.map((tool) => {
            const Icon = tool.icon
                return (
              <button className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-primary/10 hover:cursor-pointer
               ${activeTool === tool.name ? "bg-primary/10" : ""}`}
              key={tool.name} type="button" aria-label={tool.name}
              onClick={()=>changeTool(tool.name)}
               >
                <Icon size={19} className={tool.color}/>
                    </button>
                )
          })}
       </div>
      </div>
  )
}

export default Whiteboard
