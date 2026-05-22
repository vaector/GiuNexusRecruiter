import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RoleRoute = ({ roles, allowedRoles, children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const requiredRoles = allowedRoles || roles || [];
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children ? children : <Outlet />;
};

export default RoleRoute;