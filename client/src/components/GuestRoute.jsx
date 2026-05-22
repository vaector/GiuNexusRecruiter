import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) return <Navigate to="/" replace />;

  return children ? children : <Outlet />;
};

export default GuestRoute;
