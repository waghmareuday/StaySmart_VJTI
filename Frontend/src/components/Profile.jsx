import React from "react";
import myHook from "./Context";
function Profile() {
  const { user,setUser } = myHook();
  return (
    <div className="h-[90vh] bg-gray-800 flex justify-center items-center text-white ">
      {user?.name}
      {user?.email}
      {user?.id}

      <div></div>
    </div>
  );
}

export default Profile;
