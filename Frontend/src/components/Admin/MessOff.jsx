import React,{useEffect,useState} from "react";
import axios from 'axios'
function MessOff() {
    const [data,setData]=useState()
    const fetchData = async () => {
    try{
    const response = await axios.get(
        "http://localhost:5000/api/v1/admin/messoff"
      );
      console.log(response)
      setData(response.data.messoff)
     }
    catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      }
    }
    function convertToNormalDate(isoDate) {
        const date = new Date(isoDate);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    useEffect(()=>{
        fetchData()
    },[])

  return (
    <div className="w-[100%] h-[90vh] bg-gray-800 mt-1 p-2">
      <div className="text-2xl text-white">MessOff</div>

      <div className="overflow-x-auto shadow-md h-[550px] overflow-y-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs bg-gray-800 sticky top-0 text-white uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>
              <th scope="col" className="px-6 py-3">
                Option
              </th>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row, index) => (
              <tr
                key={index}
                className={`text-white border-b ${
                  index % 2 === 0 ? "bg-gray-600" : "text-white"
                }`}
              >
                <td className="px-6 py-4">{row?.name}</td>
                <td className="px-6 py-4">{row?.email}</td>
                <td className="px-6 py-4">{row?.option}</td>
                <td className="px-6 py-4">{convertToNormalDate(row?.date)}</td>
              </tr>
            ))}
            
           
            
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MessOff;
