import { useState } from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom'

function App() {

  return (
    <div className='w-screen min-h-screen bg-richblue-900 flex flex-col font-inter'>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  )
}

export default App
