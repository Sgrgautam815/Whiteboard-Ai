import { db, whiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function  POST(req:NextRequest) {
    const { projectId, elements, files, appState, base64ImagePreview } = await req.json();
    const user=await currentUser();

    if(!user){
        return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
    }
    if(projectId){
        try{
        const result=await db.insert(whiteboardData).values({
            projectId:projectId,
            elements: elements,
            appState:appState,
            files:files,
            previewImage:base64ImagePreview
        }).onConflictDoUpdate({
           target: whiteboardData.projectId,
           set: {
            elements: elements,
            appState:appState,
            files:files,
            previewImage:base64ImagePreview,
            updatedAt:new Date()
           }
        })


        return NextResponse.json(result);
    }
    catch(e){
        console.error('Failed to save whiteboard:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }




    }
    return NextResponse.json({ error: 'Project information missing' }, { status: 400 });
}