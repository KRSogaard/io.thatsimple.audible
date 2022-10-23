import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AudibleService from '../services/AudibleService';

interface Props {
  children?: ReactNode;
}

function RequireAuth({ children }: Props) {
  const location = useLocation();

  const authed = AudibleService.isAuthenticated();

  return <>{authed === true ? children : <Navigate to="/signin" replace state={{ path: location.pathname }} />}</>;
}

export default RequireAuth;
