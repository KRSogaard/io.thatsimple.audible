import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useRouteError, useLocation } from 'react-router-dom';
import { SeriesPage } from './pages/SeriesPage';
import LoginPage from './pages/LoginPage';
import Header from './components/PageLayout/Header';
import ImportPage from './pages/ImportPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import RequireAuth from './components/RequireAuth';
import RequireAuthRoute from './components/RequireAuthRoute';
import 'antd/dist/antd.min.css';
import { Layout } from 'antd';
import { Helmet } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';
import { UnauthorizedError } from './services/Errors';
import AudibleService from './services/AudibleService';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageLayout } from './components/PageLayout';
import { sortSeries } from './pages/SeriesPage/SeriesUtils';
import { SeriesList, SeriesType } from './pages/SeriesPage/components/SeriesList';

function ErrorFallback() {
  let error: Error | null = useRouteError() as Error | null;
  let location = useLocation();
  if (error instanceof UnauthorizedError) {
    console.log('UnauthorizedError redirecting to signin');
    AudibleService.logout();
    return <Navigate to={'/signin?redirect=' + location.pathname} />;
  }
  console.log('ErrorFallback: ', error);
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error?.message}</pre>
    </div>
  );
}

function App() {
  const router = createBrowserRouter([
    {
      element: <PageLayout />,
      errorElement: <ErrorFallback />,
      children: [
        {
          path: '/',
          element: <HomePage />,
        },
        {
          path: '/series',
          element: <RequireAuthRoute />,
          children: [
            {
              id: 'series',
              path: '/series',
              loader: async () => {
                if (!AudibleService.isAuthenticated()) {
                  return null;
                }
                console.log('Calling to get data');
                let myData = await AudibleService.getMyData();
                return sortSeries(myData);
              },
              element: <SeriesPage />,
              children: [
                {
                  path: '/series/',
                  element: <SeriesList seriesType={SeriesType.ACTIVE} />,
                },
                {
                  path: '/series/active',
                  element: <SeriesList seriesType={SeriesType.ACTIVE} />,
                },
                {
                  path: '/series/completed',
                  element: <SeriesList seriesType={SeriesType.COMPLETED} />,
                },
                {
                  path: '/series/archived',
                  element: <SeriesList seriesType={SeriesType.ARCHIVED} />,
                },
              ],
            },
            {
              path: '/series/import',
              element: <ImportPage />,
              loader: async () => {
                return await AudibleService.getJobs();
              },
            },
          ],
        },
        {
          path: '/signin',
          element: <LoginPage />,
        },
        {
          path: '/signup',
          element: <RegisterPage />,
        },
      ],
    },
  ]);

  return (
    <div className="App">
      <Helmet titleTemplate="%s - Audible Series Manager" defaultTitle="Audible Series Manager">
        <meta name="description" content="Audible Series Manager" />
      </Helmet>

      <RouterProvider router={router} />
    </div>
  );
}

export default App;
