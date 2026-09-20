import { db, whiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function  POST(req:NextRequest) {
    const { projectId, elements, files, appState } = await req.json();
    const user=await currentUser();

    if(!user){
        return NextResponse.json('unauthorizes user')
    }
    if(projectId){
        try{
        const result=await db.insert(whiteboardData).values({
            projectId:projectId,
            elements: elements,
            appState:appState,
            files:files
        }).onConflictDoUpdate({
           target: whiteboardData.projectId,
           set: {
            elements: elements,
            appState:appState,
            files:files,
            updatedAt:new Date()
           }
        })


        return NextResponse.json(result);
    }
    catch(e){
        return NextResponse.json('Internal serevr Error !')
    }




    }
     return NextResponse.json('project information missing')
}