import React, { useEffect, useState } from "react";
import axios from 'axios';

function Complaint() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/v1/admin/Complaint");
      console.log(response);
      setData(response.data.Complaint);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      alert("An error occurred. Please try again.");
    }
  };

  function convertToNormalDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  useEffect(() => {
    fetchData()
  }, []);

  return (
    <div className="w-[100%] h-[90vh] bg-gray-800 mt-1 p-2">
      <div className="text-2xl text-white">Complaints</div>

      <div className="overflow-x-auto shadow-md overflow-y-auto h-[550px]">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-white bg-gray-800 uppercase sticky top-0">
            <tr>
              {/* <th scope="col" className="px-6 py-3">Complaint ID</th>
              <th scope="col" className="px-6 py-3">Type</th> */}
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Details</th>
              <th scope="col" className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row, index) => (
              <tr
                key={index}
                className={`text-white border-b ${index % 2 === 0 ? "bg-gray-600" : "bg-gray-700"}`}
              >
                {/* <td className="px-6 py-4">{row?.id}</td>
                <td className="px-6 py-4">{row?.type}</td> */}
                <td className="px-6 py-4">{row?.name}</td>
                <td className="px-6 py-4">{row?.email}</td>
                <td className="px-6 py-4">{row?.details}</td>
                <td className="px-6 py-4">{convertToNormalDate(row?.createdAt)}</td>
              </tr>
            ))}
            
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Complaint;
