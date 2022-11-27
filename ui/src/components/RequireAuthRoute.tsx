import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AudibleService from '../services/AudibleService';
import { Outlet } from 'react-router-dom';

function RequireAuthRoute() {
  const location = useLocation();

  const authed = AudibleService.isAuthenticated();

  return <>{authed === true ? <Outlet /> : <Navigate to={'/signin?redirect=' + location.pathname} replace state={{ path: location.pathname }} />}</>;
}

export default RequireAuthRoute;
