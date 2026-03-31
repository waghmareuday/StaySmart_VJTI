import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/loginSignup/Login";
import Signup from "./components/loginSignup/Signup";
import LostnFound from "./components/LostnFound/LostFoundForm";
import HostelLeavingForm from "./components/HostelLeavingForm/HostelLeavingForm";
import ApplicationForm from "./components/HostelAllotment/ApplicationForm";
import MessBill from "./components/MessBill/MessBill";
import MessFeedback from "./components/Feedback/MessFeedback";
import HostelFeedback from "./components/Feedback/HostelFeedback";
import MessSchedule from "./components/MessSchedule/messschedule";
import Complaint from "./components/Complaint/Complaint";
import Event from "./components/Event/event";
import MessOff from "./components/MessOff/messoff";
import RoomSwap from "./components/RoomSwap/RoomSwap";
import MaintenanceRequest from "./components/Maintenance/MaintenanceRequest";
import NightOutPass from "./components/NightOut/NightOutPass";
import WardenNightOutManager from "./components/NightOut/WardenNightOutManager";
import DuesPayment from "./components/Dues/DuesPayment";
import { ContextProvider } from "./components/Context";
import AdminHome from "./components/Admin/AdminHome";
import Layout from "./components/Layout";
import Dashboard from "./components/Admin/Dashboard";
import AdminMessoff from "./components/Admin/MessOff";
import AdminHostelFeedback from "./components/Admin/AdminHostelFeedback";
import AdminMessFeedback from "./components/Admin/AdminMessFeedback";
import Profile from "./components/Profile";
import StudentDashboard from "./components/StudentDashboard";

import AdminComplaint from "./components/Admin/Complaint";
import HostelAllotment from "./components/Admin/HostelAllotment";
import AdminProfile from "./components/Admin/AdminProfile";
import RoomSwapAdmin from "./components/Admin/RoomSwapAdmin";
import MaintenanceAdmin from "./components/Admin/MaintenanceAdmin";
import NightOutAdmin from "./components/Admin/NightOutAdmin";
import DuesAdmin from "./components/Admin/DuesAdmin";
import WardenAttendance from "./components/Attendance/WardenAttendance";
import AttendanceAdmin from "./components/Admin/AttendanceAdmin";
import AdminNotices from "./components/Admin/AdminNotices";
import { AdminRoute, GuestRoute, WardenRoute, StudentRoute } from "./components/ProtectedRoute";


function App() {
  return (
    <>
      <ContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<Home />}></Route>
              <Route path="/Login" element={<GuestRoute><Login /></GuestRoute>}></Route>
              <Route path="/Signup" element={<GuestRoute><Signup /></GuestRoute>}></Route>
              <Route path="/Event" element={<Event />}></Route>
              <Route path="/MessSchedule" element={<MessSchedule />}></Route>
              
              {/* Protected routes (require login) */}
              <Route path="/LostnFound" element={<StudentRoute><LostnFound /></StudentRoute>}></Route>
              <Route path="/HostelLeavingForm" element={<StudentRoute><HostelLeavingForm /></StudentRoute>}></Route>
              <Route path="/RoomAllotment" element={<StudentRoute><ApplicationForm /></StudentRoute>}></Route>
              <Route path="/MessBill" element={<StudentRoute><MessBill /></StudentRoute>}></Route>
              <Route path="/MessFeedback" element={<StudentRoute><MessFeedback /></StudentRoute>}></Route>
              <Route path="/HostelFeedback" element={<StudentRoute><HostelFeedback /></StudentRoute>}></Route>
              <Route path="/Complaint" element={<StudentRoute><Complaint /></StudentRoute>}></Route>
              <Route path="/MessOff" element={<StudentRoute><MessOff /></StudentRoute>}></Route>
              <Route path="/RoomSwap" element={<StudentRoute><RoomSwap /></StudentRoute>}></Route>
              <Route path="/Maintenance" element={<StudentRoute><MaintenanceRequest /></StudentRoute>}></Route>
              <Route path="/NightOutPass" element={<StudentRoute><NightOutPass /></StudentRoute>}></Route>
              <Route path="/Dues" element={<StudentRoute><DuesPayment /></StudentRoute>}></Route>
              <Route path="/Attendance" element={<WardenRoute><WardenAttendance /></WardenRoute>}></Route>
              <Route path="/Warden/NightOut" element={<WardenRoute><WardenNightOutManager /></WardenRoute>}></Route>
              <Route path="/Profile" element={<StudentRoute><Profile /></StudentRoute>}></Route>
              <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>}></Route>
            </Route>

            {/* Admin routes (require admin role) */}
            <Route exact path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>}>
              <Route path="/admin/profile" element={<AdminProfile />}></Route>
              <Route path="/admin/dashboard" element={<Dashboard />}></Route>
              <Route path="/admin/messoff" element={<AdminMessoff />}></Route>
              <Route path="/admin/hostelfeedback" element={<AdminHostelFeedback />}></Route>
              <Route path="/admin/messfeedback" element={<AdminMessFeedback />}></Route>
              <Route path="/admin/complaint" element={<AdminComplaint />}></Route>
              <Route path="/admin/HostelAllotment" element={<HostelAllotment />}></Route>
              <Route path="/admin/room-swaps" element={<RoomSwapAdmin />}></Route>
              <Route path="/admin/maintenance" element={<MaintenanceAdmin />}></Route>
              <Route path="/admin/night-out" element={<NightOutAdmin />}></Route>
              <Route path="/admin/dues" element={<DuesAdmin />}></Route>
              <Route path="/admin/attendance" element={<AttendanceAdmin />}></Route>
              <Route path="/admin/notices" element={<AdminNotices />}></Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ContextProvider>
    </>
  );
}

export default App;
