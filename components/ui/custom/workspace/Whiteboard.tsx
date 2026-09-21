"use client"
import React,{useRef,useState} from "react";
import "@excalidraw/excalidraw/index.css"
import {
  Excalidraw,
} from "@excalidraw/excalidraw";
import { useParams } from "next/navigation";
import { ArrowRight, Circle, Diamond, Eraser, Hand, Image as ImageIcon, Minus, MousePointer2, Pencil, Sparkles, Square, Type } from "lucide-react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import FloatingProperties from "./FloatingProerties";
import AIFloatingSiderbar from "./AIFloatingSiderbar";


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

type Props = {
    onApiReady: (api: ExcalidrawImperativeAPI) => void;
};



function Whiteboard({ onApiReady }: Props) {
     const [excalidrawAPI, setExcalidRawAPI] = useState<ExcalidrawImperativeAPI|null>(null);
     const  savetimeRef = useRef<any>(null);
    const { projectId } = useParams<{ projectId: string }>();
    const [activeTool,setActiveTool]=useState('selection');
    const [selectedElement, setselectedElement]=useState<any>(null);
    const [canvasState, setCanvasState]=useState<any>(null);
    const [ShowAiSidebar,setShowAiSidebar]=useState(false);

      const handleCanvasChange=(elements:readonly any[],appState:any ,files:any)=>{

         setCanvasState(appState);

        //fine selected Elements
        const selectedIds=Object.keys(
            appState.selectedElementIds || {}
        ) 
        if(selectedIds.length===1){
            const element=elements.find(
                (element)=>element.id==selectedIds[0]
            )
            setselectedElement(element);
        }else{
            setselectedElement(null);
        }

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

    const getFloatingPosition=()=>{
        if(!selectedElement || !canvasState){
            return {left:0,top:0}
        }
        const zoom = canvasState.zoom?.value ?? 1
        const  scrollX= canvasState.scrollX?.value ?? 0
        const scrollY = canvasState.scrollY?.value ?? 0

        const centerX = 
             selectedElement.x+selectedElement.width / 2


        const screenX =
                (centerX + scrollX) * zoom
        
         const screenY =
                (selectedElement.y + scrollY) * zoom

        return {
            left:screenX,
            top: screenY-60
        }
     }
         const handlePropertyChange=(property:string,value:unknown)=>{
        if(!excalidrawAPI|| !selectedElement) return ;

                const elements=excalidrawAPI.getSceneElements();
                const updatedElements=elements.map((element)=>{
                        if(element.id !== selectedElement.id){
                                return element;
            }
        
        return{
                        ...element,
            [property]:value,
            version:element.version+1,
                        updated:Date.now(),
                        versionNonce:Math.floor(Math.random() * 2147483647),
        }
     });

         excalidrawAPI.updateScene({
             elements: updatedElements,
             appState: {
                 selectedElementIds: { [selectedElement.id]: true },
             },
         });
    }

        const handleDuplicate = () => {
            if (!excalidrawAPI || !selectedElement) return;

            const duplicate = {
                ...selectedElement,
                id: crypto.randomUUID(),
                x: Number(selectedElement.x ?? 0) + 20,
                y: Number(selectedElement.y ?? 0) + 20,
                version: 1,
                versionNonce: Math.floor(Math.random() * 2147483647),
                isDeleted: false,
            };

            excalidrawAPI.updateScene({
                elements: [...excalidrawAPI.getSceneElements(), duplicate],
                appState: { selectedElementIds: { [duplicate.id]: true } },
            });
        };

        const handleToggleLock = () => {
            handlePropertyChange("locked", !Boolean(selectedElement?.locked));
        };

        const handleDelete = () => {
            if (!excalidrawAPI || !selectedElement) return;

            excalidrawAPI.updateScene({
                elements: excalidrawAPI
                    .getSceneElements()
                    .filter((element) => element.id !== selectedElement.id),
                appState: { selectedElementIds: {} },
            });
        };

        const handleBringToFront = () => {
            if (!excalidrawAPI || !selectedElement) return;

            const elements = excalidrawAPI.getSceneElements();
            const selected = elements.find((element) => element.id === selectedElement.id);
            if (!selected) return;

            excalidrawAPI.updateScene({
                elements: [...elements.filter((element) => element.id !== selected.id), selected],
                appState: { selectedElementIds: { [selected.id]: true } },
            });
        };

        const handleSendToBack = () => {
            if (!excalidrawAPI || !selectedElement) return;

            const elements = excalidrawAPI.getSceneElements();
            const selected = elements.find((element) => element.id === selectedElement.id);
            if (!selected) return;

            excalidrawAPI.updateScene({
                elements: [selected, ...elements.filter((element) => element.id !== selected.id)],
                appState: { selectedElementIds: { [selected.id]: true } },
            });
        };

     const floatingPosition =getFloatingPosition();
     

  return (
    <div className="relative" style={{ height: "calc(100vh - 88px)", width: "100%" }}>
        <Excalidraw
            excalidrawAPI={(api) => {
                setExcalidRawAPI(api);
                onApiReady(api);
            }}
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
          <FloatingProperties
            selectedElement={selectedElement}
            position={floatingPosition}
                        onPropertyChange={handlePropertyChange}
                        onDuplicate={handleDuplicate}
                        onToggleLock={handleToggleLock}
                        onDelete={handleDelete}
                        onBringToFront={handleBringToFront}
                        onSendToBack={handleSendToBack}
          />
          <div className="absolute right-15 bottom-2 z-50">
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-md hover:bg-slate-50"
                            onClick={()=> setShowAiSidebar(!ShowAiSidebar)}
                        >
                <Sparkles/>AI
            </button>
          </div>

          {ShowAiSidebar && (
            <AIFloatingSiderbar
              excalidrawApi={excalidrawAPI}
              onClose={() => setShowAiSidebar(false)}
            />
          )}
        
      </div>
  )
}

export default Whiteboard
