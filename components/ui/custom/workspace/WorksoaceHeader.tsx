"use client"
import Image from 'next/image'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Save, Share } from 'lucide-react'

type Props={
  selectedTab: (value: string) => void
}


function WorksoaceHeader({selectedTab}:Props) {
  return (
    <div className='p-3 border-b flex justify-between'>
        <div className='flex gap-2 items-center'>
      <Image src={'/logo.svg'} alt='logo' width={60} height={60}/>
      <h2>Workspace name </h2>
      </div>
        {/* switch */}
      <div>
        <Tabs defaultValue="whiteBoard"
        onValueChange={(value) => selectedTab(value)}
        >
             <TabsList>
            <TabsTrigger value="whiteBoard">whiteBoard</TabsTrigger>
            <TabsTrigger value="doc">doc</TabsTrigger>
            </TabsList>
        </Tabs>

      </div>
      {/* extra Button*/}
      <div className='flex gap-2'>
        <Button type="button" size="sm" variant="default">
          <Save /> Save
        </Button>
        <Button type="button" size="sm" variant="destructive">
          <Share /> Share
        </Button>
      </div>

    </div>
  )
}

export default WorksoaceHeader