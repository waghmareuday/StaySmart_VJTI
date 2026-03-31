import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
// import themeHook from '../Context'
import { Outlet } from 'react-router-dom'

function AdminHome() {
    // const { sidebarvalue } = themeHook
    return (
        <div className='bg-gray-900 min-h-screen'>
            <Navbar />
            <div className='pt-24 px-4 md:px-6 pb-6'>
                <div className='mx-auto max-w-[1500px] grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4'>
                    <Sidebar />
                    <main className='min-w-0'>
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}

export default AdminHome