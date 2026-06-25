import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { RoadmapProvider } from './features/roadmap/RoadmapProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, gcTime: Infinity },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RoadmapProvider>
          <App />
        </RoadmapProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
