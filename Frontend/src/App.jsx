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
function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/Login" element={<Login />}></Route>
          <Route path="/Signup" element={<Signup />}></Route>
          <Route path="/LostnFound" element={<LostnFound />}></Route>
          <Route path="/HostelLeavingForm" element={<HostelLeavingForm/>}></Route>
          <Route path="/RoomAllotment" element={<RoomAllotmentForm/>}></Route>
          <Route path="/MessBill" element={<MessBill/>}></Route>
          <Route path="/MessFeedback" element={<MessFeedback/>}></Route>
          <Route path="/HostelFeedback" element={<HostelFeedback/>}></Route>
          <Route path="/MessSchedule" element={<MessSchedule />}></Route>
          <Route path="/Complaint" element={<Complaint />}></Route>
          <Route path="/Event" element={<Event />}></Route>
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
