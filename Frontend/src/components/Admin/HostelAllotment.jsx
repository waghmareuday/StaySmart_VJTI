import React, { useEffect, useState } from "react";
import axios from "axios";

function HostelAllotment() {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/v1/admin/HostelAllotment"
      );
      console.log(response);
      setData(response.data.HostelAllotment);
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
  const handletoggle = async (id) => {

    try {
        const response = await axios.post(
          `http://localhost:5000/api/v1/admin/toggle-allotment/${id}`
        );
        console.log(response);
        // setData(response.data.HostelAllotment);
        alert("Status Updated");
        fetchData();
      } catch (error) {
        console.error("Error fetching complaints:", error);
        alert("An error occurred. Please try again.");
      }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="w-[100%] h-[90vh] bg-gray-800 mt-1 p-2">
      <div className="text-2xl text-white">HostelAllotment</div>

      <div className="overflow-x-auto shadow-md overflow-y-auto h-[550px]">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-white bg-gray-800 uppercase sticky top-0">
            <tr>
              {/* <th scope="col" className="px-6 py-3">Complaint ID</th>
              <th scope="col" className="px-6 py-3">Type</th> */}
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Reg.No
              </th>
              <th scope="col" className="px-6 py-3">
                Department
              </th>
              <th scope="col" className="px-6 py-3">
                Roomype
              </th>
              <th scope="col" className="px-6 py-3">
                Contact
              </th>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row, index) => (
              <tr
                key={index}
                className={`text-white border-b ${
                  index % 2 === 0 ? "bg-gray-600" : "bg-gray-700"
                }`}
              >
                {/* <td className="px-6 py-4">{row?.id}</td>
                <td className="px-6 py-4">{row?.type}</td> */}
                <td className="px-6 py-4">{row?.fullName}</td>
                <td className="px-6 py-4">{row?.rollNumber}</td>
                <td className="px-6 py-4">{row?.department}</td>
                <td className="px-6 py-4">{row?.roomType}</td>
                <td className="px-6 py-4">{row?.contact}</td>
                <td className="px-6 py-4">
                  {convertToNormalDate(row?.arrivalDate)}
                </td>
                <td className="px-6 py-4 cursor-pointer" onClick={()=>{
                    handletoggle(row?._id)}}>
                  {row?.alloted ? (
                    <p className="bg-green-600 w-max p-2 rounded-xl text-[13px]">
                      Alloted
                    </p>
                  ) : (
                    <p className="bg-red-600 w-max p-2 rounded-xl text-[13px]">
                      Not Alloted
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HostelAllotment;
