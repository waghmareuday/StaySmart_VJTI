import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import myHook from "../Context";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Register chart components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function Dashboard() {
  const { user, setUser } = myHook(); // Get user data from context
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [hostelFeedback, setHostelFeedback] = useState([]);
  const [messFeedback, setMessFeedback] = useState([]);

  // Fetch total complaints
  const fetchComplaints = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/v1/admin/Complaint");
      setComplaints(response.data.Complaint);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  // Fetch hostel feedback
  const fetchHostelFeedback = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/v1/admin/hostelfeedback");
      setHostelFeedback(response.data.hostelfeedback);
    } catch (error) {
      console.error("Error fetching hostel feedback:", error);
    }
  };

  // Fetch mess feedback
  const fetchMessFeedback = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/v1/admin/messfeedback");
      setMessFeedback(response.data.messfeedback);
    } catch (error) {
      console.error("Error fetching mess feedback:", error);
    }
  };

  const [data,setData]=useState()
  const fetchData=async()=>{
    try{
      const response = await axios.get(
        "http://localhost:5000/api/v1/admin/getTotalCount"
      );
      console.log(response)
      setData(response.data)

    }catch(err){
      alert("An error occurred. Please try again.");
    }
  }
  


  useEffect(() => {
    fetchData();
    fetchComplaints();
    fetchHostelFeedback();
    fetchMessFeedback();
  }, []);

  const handleLogout = () => {
    setUser(null); // Clear user data
    navigate("/login"); // Redirect to login page
  };

  // Function to group complaints by date
  const groupComplaintsByDate = () => {
    const groupedComplaints = {};
    complaints.forEach(complaint => {
      const date = new Date(complaint.date).toLocaleDateString();
      if (!groupedComplaints[date]) {
        groupedComplaints[date] = 0;
      }
      groupedComplaints[date]++;
    });
    return groupedComplaints;
  };

  // Chart Data Preparation
  const complaintsGroupedByDate = groupComplaintsByDate();
  const complaintDates = Object.keys(complaintsGroupedByDate);
  const complaintCounts = Object.values(complaintsGroupedByDate);

  const complaintsChartData = {
    labels: complaintDates,
    datasets: [
      {
        label: 'Complaints per Day',
        data: complaintCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const hostelFeedbackChartData = {
    labels: ['1', '2', '3', '4', '5'], // Rating scale
    datasets: [
      {
        label: 'Hostel Feedback Rating',
        data: [hostelFeedback.filter(f => f.rating === 1).length, 
               hostelFeedback.filter(f => f.rating === 2).length, 
               hostelFeedback.filter(f => f.rating === 3).length, 
               hostelFeedback.filter(f => f.rating === 4).length, 
               hostelFeedback.filter(f => f.rating === 5).length],
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const messFeedbackChartData = {
    labels: ['1', '2', '3', '4', '5'], // Rating scale
    datasets: [
      {
        label: 'Mess Feedback Rating',
        data: [messFeedback.filter(f => f.rating === 1).length, 
               messFeedback.filter(f => f.rating === 2).length, 
               messFeedback.filter(f => f.rating === 3).length, 
               messFeedback.filter(f => f.rating === 4).length, 
               messFeedback.filter(f => f.rating === 5).length],
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-[100%] h-[90vh] bg-gray-900 mt-1  flex flex-col p-4">
      {/* Admin Dashboard Container */}
      <h1 className="text-gray-100">DashBoard</h1>
        {/* Admin Avatar */}
        <div className="h-[80vh]   py-5">

          <div className="text-white grid grid-cols-5 gap-2 ">
            <div className=" bg-gray-700 p-4 rounded-md">
               <p>Total Students</p>
               <p>{data?.totalCountStudents}</p>
            </div>
            <div className=" bg-gray-700 p-4 rounded-md">
               <p>Hostel Alloted</p>
               <p>{data?.HostelAllotted}</p>
            </div>
            <div className=" bg-gray-700 p-4 rounded-md">
               <p>Hostel Not Alloted</p>
               <p>{data?.HostelNotAllotted}</p>
            </div>
            <div className=" bg-gray-700 p-4 rounded-md">
               <p>Total Complaints</p>
               <p>{data?.totalComplaint}</p>
            </div>
          
</div>
</div>

        {/* Charts */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl text-white mb-4">Complaints per Day</h2>
            <div style={{ width: '100%', height: '250px' }}>
              <Bar data={complaintsChartData} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl text-white mb-4">Hostel Feedback (Based on Rating)</h2>
            <div style={{ width: '100%', height: '250px' }}>
              <Bar data={hostelFeedbackChartData} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl text-white mb-4">Mess Feedback (Based on Rating)</h2>
            <div style={{ width: '100%', height: '250px' }}>
              <Bar data={messFeedbackChartData} />
            </div>
          </div>
        </div>

        {/* Logout Button */}
        
      
    </div>
  );
}

export default Dashboard;
