import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
// import themeHook from '../Context'
import { Outlet } from 'react-router-dom'

function AdminHome() {
    // const { sidebarvalue } = themeHook
    return (
        <div className='bg-[#f5f5f5] w-full h-[90vh]'>
            <Navbar />
            <div className=' grid grid-col-1 min-[900px]:grid-cols-[17%_auto]'>
                <div className=' '>
                    <Sidebar />
                    
                </div>
                <div >
                    <Outlet />
                </div>
                {/* <div className=' hidden min-[900px]:block'>
                    <Outlet />
                </div> */}
            </div>
        </div>
    )
}

export default AdminHome