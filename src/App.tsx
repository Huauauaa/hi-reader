import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ShelfPage } from './pages/ShelfPage'
import { ReaderPage } from './pages/ReaderPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<ShelfPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  )
}
