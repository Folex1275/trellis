import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CreateAgreementPage from './pages/CreateAgreementPage'
import AgreementStatusPage from './pages/AgreementStatusPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateAgreementPage />} />
          <Route path="/status" element={<AgreementStatusPage />} />
          <Route path="/agreement/:id" element={<AgreementStatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
