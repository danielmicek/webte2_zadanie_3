import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AppLayout } from './App.jsx'
import ErrorNotFound from './pages/ErrorNotFound.jsx'
import GamePage from './pages/GamePage.jsx'
import HomePage from './pages/HomePage.jsx'
import LobbyPage from './pages/LobbyPage.jsx'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
        errorElement: <ErrorNotFound />,
      },
      {
        path: '/lobby',
        element: <LobbyPage />,
        errorElement: <ErrorNotFound />,
      },
      {
        path: '/game',
        element: <GamePage />,
        errorElement: <ErrorNotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorNotFound />,
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
