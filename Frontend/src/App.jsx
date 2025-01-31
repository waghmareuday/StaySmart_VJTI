import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Login from "./components/loginSignup/Login";
import Signup from "./components/loginSignup/Signup";
import LostnFound from "./components/LostnFound/LostFoundForm";
import HostelLeavingForm from "./components/HostelLeavingForm/HostelLeavingForm";
import RoomAllotmentForm from "./components/HostelAllotment/HosteAllotment";
import MessBill from "./components/MessBill/MessBill";
import MessFeedback from "./components/Feedback/MessFeedback";
import HostelFeedback from "./components/Feedback/HostelFeedback";
import MessSchedule from "./components/MessSchedule/messschedule";
import Complaint from "./components/Complaint/complaint";
import Event from "./components/Event/event";
import MessOff from "./components/MessOff/messoff";
import { ContextProvider } from "./components/Context";
import AdminHome from "./components/Admin/AdminHome";
import Layout from "./components/Layout";
import Dashboard from "./components/Admin/Dashboard";
import AdminMessoff from "./components/Admin/MessOff";
import AdminHostelFeedback from "./components/Admin/AdminHostelFeedback";
import AdminMessFeedback from "./components/Admin/AdminMessFeedback";
import Profile from "./components/Profile";

import AdminComplaint from "./components/Admin/Complaint";
import HostelAllotment from "./components/Admin/HostelAllotment";
import AdminProfile from "./components/Admin/AdminProfile";


function App() {
  return (
    <>
      <ContextProvider>
        <BrowserRouter>
          {/* <Navbar /> */}
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/" element={<Home />}></Route>
              <Route path="/Login" element={<Login />}></Route>
              <Route path="/Signup" element={<Signup />}></Route>
              <Route path="/LostnFound" element={<LostnFound />}></Route>
              <Route
                path="/HostelLeavingForm"
                element={<HostelLeavingForm />}
              ></Route>
              <Route
                path="/RoomAllotment"
                element={<RoomAllotmentForm />}
              ></Route>
              <Route path="/MessBill" element={<MessBill />}></Route>
              <Route path="/MessFeedback" element={<MessFeedback />}></Route>
              <Route
                path="/HostelFeedback"
                element={<HostelFeedback />}
              ></Route>
              <Route path="/MessSchedule" element={<MessSchedule />}></Route>
              <Route path="/Complaint" element={<Complaint />}></Route>
              <Route path="/Event" element={<Event />}></Route>
              <Route path="/MessOff" element={<MessOff />}></Route>
              <Route path="/Profile" element={<Profile/>}></Route>
            </Route>

            <Route exact path="/admin" element={<AdminHome />}>
            <Route path="/admin/profile" element={<AdminProfile/>}></Route>
              <Route path="/admin/dashboard" element={<Dashboard />}></Route>
              <Route path="/admin/messoff" element={<AdminMessoff />}></Route>

              <Route path="/admin/hostelfeedback" element={<AdminHostelFeedback />}></Route>
              <Route path="/admin/messfeedback" element={<AdminMessFeedback />}></Route>

              <Route path="/admin/complaint" element={<AdminComplaint />}></Route>
              <Route path="/admin/HostelAllotment" element={<HostelAllotment />}></Route>

            </Route>
          </Routes>
          {/* <Footer /> */}
        </BrowserRouter>
      </ContextProvider>
    </>
  );
}

export default App;
