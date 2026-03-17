import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Enable MSW in development mode if VITE_USE_MOCKS is set
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    return
  }

  const { worker } = await import('./mocks/browser')

  return worker.start({
    onUnhandledRequest: 'bypass',
  }).then(() => {
    console.log('[MSW] ✅ Mocking enabled!')
  })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})

