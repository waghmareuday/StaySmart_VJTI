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
 
          <Link to="/admin/messoff" className='p-1 text-white cursor-pointer'>MessOff</Link>

          <Link to="/admin/Complaint" className='p-1 text-white cursor-pointer'>Complaints</Link>
          <Link to="/admin/hostelfeedback" className='p-1 text-white cursor-pointer'>Hostel Feedbacks</Link>
          <Link to="/admin/messfeedback" className='p-1 text-white cursor-pointer'>Mess Feedbacks</Link>

        </ul>
      </div>
    </div>
  )
}

export default Sidebar