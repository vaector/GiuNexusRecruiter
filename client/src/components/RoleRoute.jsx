import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles?.length > 0 && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children ? children : <Outlet />;
};

export default RoleRoute;
