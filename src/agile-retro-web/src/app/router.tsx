import { createBrowserRouter } from 'react-router'
import { App } from './App'
import { DesignPage } from '../pages/DesignPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'design', element: <DesignPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
