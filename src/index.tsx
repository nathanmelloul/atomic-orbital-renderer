import { Viewer } from "./Viewer";

export const navLinks = [
    { id: 'about', title: 'More about me' },
    { id: 'projects', title: 'Projects' },
    { id: 'skills', title: 'Skills' },
    { id: 'contact', title: 'Say hello :)' }
]

export const publicRoutes = [
    {
        index: true,        // <--- This makes it the "First Page"
        element: <Viewer />,  // This component fills the <Outlet />
    },
    // ... imagine 50 more
];