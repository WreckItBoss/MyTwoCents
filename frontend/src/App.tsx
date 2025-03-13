import { useState } from 'react'
import LandingPage from './LandingPage/LandingPage'
import Content from './Content/Content'
import reactLogo from './assets/react.svg'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import viteLogo from '/vite.svg'
import './App.css'

function App() {

  return (

    <Router>
      <Routes>
      <Route path="/mainpage" element={<LandingPage />} />
      <Route path="contentpage" element ={<Content/>} />
      <Route path="/" element={<Navigate to="/mainpage" />} /> {}
      </Routes>
    </Router>

  )
}

export default App
