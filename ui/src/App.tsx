import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SeriesPage from './pages/SeriesPage';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import ImportPage from './pages/ImportPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import RequireAuth from './components/RequireAuth';
import 'antd/dist/antd.min.css';
import { Layout } from 'antd';
import { Helmet } from 'react-helmet-async';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Helmet titleTemplate="%s - audible.thatsimple.io" defaultTitle="audible.thatsimple.io">
          <meta name="description" content="Audible series manager" />
        </Helmet>

        <Layout style={{ minHeight: '100vh' }}>
          <Layout.Header>
            <Header />
          </Layout.Header>
          <Layout.Content>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/series"
                element={
                  <RequireAuth>
                    <SeriesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/import"
                element={
                  <RequireAuth>
                    <ImportPage />
                  </RequireAuth>
                }
              />
              <Route path="/signin" element={<LoginPage />} />
              <Route path="/signup" element={<RegisterPage />} />
            </Routes>
          </Layout.Content>
          {/* <Layout.Footer>Footer</Layout.Footer> */}
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
