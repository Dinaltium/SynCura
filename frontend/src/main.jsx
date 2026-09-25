import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './theme/tokens.css'
import './motion/motion.css'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <App />
)
