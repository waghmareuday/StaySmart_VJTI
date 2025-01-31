import React from 'react'
import {Link} from 'react-router-dom'

function Navbar() {
  return (
    <div className='w-[100%] h-20 bg-gray-800 flex justify-between items-center p-2'>
         <Link to="/" className="logo text-2xl text-white font-bold">VJTI StaySmart</Link>
         <Link to="/admin/profile" className="logo text-2xl text-white font-bold">Admin</Link>
    </div>
  )
}

export default Navbar