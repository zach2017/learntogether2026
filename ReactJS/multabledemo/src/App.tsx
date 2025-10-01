import { useState } from 'react'

import './App.css'
import DemoComponent from './Demo'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <DemoComponent/>
    </>
  )
}

export default App
