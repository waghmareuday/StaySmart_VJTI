import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import holi from "../../assets/holi.jpg";
import cricket from "../../assets/cricket.jpg";
import djnight from "../../assets/djnight.jpg";
import garba from "../../assets/garba.jpg";
import volleyball from "../../assets/volleyball.jpg";
import football from "../../assets/football.jpg";
import musicfest from "../../assets/musicfest.jpg";

const images = [
  { src: holi, title: "VJTI Staysmart Presents", subtitle: "A Celebration of Culture and Fun" },
  { src: cricket, title: "Hostel Premier League", subtitle: "Show Your Cricket Skills" },
  { src: djnight, title: "DJ Night", subtitle: "Dance the Night Away!" },
  { src: garba, title: "Garba", subtitle: "Traditional Dance Festivities" },
];

const events = [
  { src: volleyball, title: "Volleyball Championship", subtitle: "Spike Your Way to Victory" },
  { src: football, title: "Inter-College Football", subtitle: "Goal of Excellence" },
  { src: musicfest, title: "Annual Music Fest", subtitle: "Harmony of Talents" },
];

function Event() {
  const settings = {
    centerMode: true,
    centerPadding: "10%",
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    appendDots: (dots) => (
      <div className="absolute bottom-4 w-full">
        <ul className="flex justify-center gap-2">{dots}</ul>
      </div>
    ),
    customPaging: (i) => (
      <div className="w-3 h-3 bg-white rounded-full transition-all duration-300 hover:scale-125"></div>
    ),
  };

  return (
    <div className="bg-gray-800 text-white min-h-screen pt-28 pb-16">
      {/* Existing Slider */}
      <div className="relative w-full mb-16">
        <Slider {...settings}>
          {images.map((image, index) => (
            <div key={index} className="px-4">
              <div className="relative overflow-hidden">
                <img
                  src={image.src}
                  alt={image.title}
                  className="rounded-lg w-full h-[450px] object-cover transform transition-transform duration-500 hover:scale-105"
                />
                {index === 0 ? (
                  <div className="absolute left-0 top-0 w-full h-full bg-black bg-opacity-40 backdrop-blur-sm p-8 flex flex-col justify-center items-start">
                    <h2 className="text-5xl font-bold text-white">{image.title}</h2>
                    <p className="text-2xl text-white mt-2">{image.subtitle}</p>
                  </div>
                ) : (
                  <div className="absolute left-4 bottom-4 bg-black bg-opacity-40 rounded-md p-4">
                    <h3 className="text-2xl font-bold">{image.title}</h3>
                    <p className="text-lg mt-1">{image.subtitle}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Registration Section */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Register Now</h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Registration Form */}
          <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
            <form className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">Select Event</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                >
                  <option value="">Choose an event</option>
                  {events.map((event, index) => (
                    <option key={index} value={event.title}>{event.title}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Register Now
              </button>
            </form>
          </div>

          {/* Event Highlights */}
          <div className="grid gap-6">
            {events.map((event, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={event.src} 
                  alt={event.title} 
                  className="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 flex flex-col justify-end">
                  <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-gray-200">{event.subtitle}</p>
                  <button className="mt-4 self-start bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Event;