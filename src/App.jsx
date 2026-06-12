import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Tickets from './pages/Tickets'
import Gallery from './pages/Gallery'
import GalleryAlbum from './pages/GalleryAlbum'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<EventDetail />} />
          <Route path="events/:eventId/tickets" element={<Tickets />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="gallery/:albumId" element={<GalleryAlbum />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:postId" element={<BlogPost />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
