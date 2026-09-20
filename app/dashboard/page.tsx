import { UserButton } from '@clerk/nextjs'
import React from 'react'

function Dashboardpage() {
  return (
    <div>
        <UserButton />
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  )
}

export default Dashboardpage
