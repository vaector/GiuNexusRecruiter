import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminRecruitersPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/users?role=recruiter", { replace: true });
  }, [navigate]);

  return null;
};

export default AdminRecruitersPage;
