import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AdminLayout, { AdminGuard } from './components/admin/AdminLayout'
import { AdminRoute, StaffRoute } from './components/admin/AdminRoutes'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Tickets from './pages/Tickets'
import Gallery from './pages/Gallery'
import GalleryAlbum from './pages/GalleryAlbum'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHome from './pages/admin/AdminHome'
import AdminEvents from './pages/admin/AdminEvents'
import AdminGallery from './pages/admin/AdminGallery'
import AdminBlog from './pages/admin/AdminBlog'
import AdminMedia from './pages/admin/AdminMedia'
import AdminMembers from './pages/admin/AdminMembers'
import AdminCheckIn from './pages/admin/AdminCheckIn'

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

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<StaffRoute><AdminDashboard /></StaffRoute>} />
          <Route path="home" element={<StaffRoute><AdminHome /></StaffRoute>} />
          <Route path="events" element={<StaffRoute><AdminEvents /></StaffRoute>} />
          <Route path="gallery" element={<StaffRoute><AdminGallery /></StaffRoute>} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="check-in" element={<AdminCheckIn />} />
          <Route path="members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
