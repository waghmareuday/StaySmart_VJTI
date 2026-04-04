import React, { useState } from 'react';

function Listings() {
  const [listings, setListings] = useState([]);
  
  // You can add new listings here after form submission
  const addListing = (listing) => {
    setListings([listing, ...listings]);
  };

  return (
    <div className="py-5 w-full max-w-3xl">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#60a5fa] text-left">Recent Listings</h2>
      <div id="listingsContainer" className="">
        {listings.length === 0 ? (
          <p className="text-white">No items listed yet. Be the first to post!</p>
        ) : (
          listings.map((listing, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded shadow-md">
              <h3 className="text-xl font-bold text-white">{listing.itemType.toUpperCase()}: {listing.itemName}</h3>
              <p className="text-white">{listing.description}</p>
              <p className="text-white">Location: {listing.location}</p>
              <p className="text-white">Contact: {listing.contact}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Listings;
