import React from 'react'
import { Link } from 'react-router-dom'

function Sidebar() {
  return (
    <div className='w-[250px] mt-1 h-[90vh] bg-gray-800 z-20'>
      <div className='p-4'>
        <ul className='space-y-4 justify-center flex flex-col'>
          <Link to="/admin/dashboard" className='p-1 text-white cursor-pointer'>
            Dashboard
            </Link>
          <Link to="/admin/HostelAllotment" className='p-1 text-white cursor-pointer'>Hostell Allotment</Link>
          <Link className='p-1 text-white cursor-pointer'>Users</Link>
          <li className='p-1 text-white cursor-pointer'>Events</li>
          <Link to="/admin/messoff" className='p-1 text-white cursor-pointer'>MessOff</Link>
          <Link to="/admin/Complaint" className='p-1 text-white cursor-pointer'>Complaints</Link>
          <li className='p-1 text-white cursor-pointer'>Feedback</li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar