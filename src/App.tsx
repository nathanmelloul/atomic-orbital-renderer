// import './App.css'

// import { gsap } from "gsap";
// import { useGSAP } from "@gsap/react";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

import { createBrowserRouter, RouterProvider, Outlet } from 'react-router';

// gsap.registerPlugin(ScrollTrigger, useGSAP);


// import { Navbar } from './Navbar.tsx';
import { publicRoutes } from './index.tsx';


function RootLayout() {
  return (
    <main className="overflow-x-hidden">
      <Outlet />
    </main>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: publicRoutes, // Your 200+ routes go here
  },
]);


function App() {
  return <RouterProvider router={router} />;
}

export default App;