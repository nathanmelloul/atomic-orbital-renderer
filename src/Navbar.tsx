import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { Link } from 'react-router';

import { navLinks } from "./index.tsx";
import { useRef } from 'react';


export const Navbar = () => {

    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const navTween = gsap.timeline({
            scrollTrigger: {
                trigger: 'nav',
                start: 'bottom top'
            }
        });

        navTween.fromTo('nav', { backgroundColor: 'transparent' }, {
            backgroundColor: '#00000050',
            backgroundFilter: 'blur(10px)',
            duration: 1,
            ease: 'power1.inOut'
        });

    }, { scope: container });



    return (
        <nav ref={container}>
            <div className="fixed top-0 min-w-screen z-50 bg-black/10 backdrop-filter backdrop-blur-lg shadow-xl py-2.5">

                <div className="flex justify-center items-center inset-0 flex-wrap px-4 mx-auto">

                    <div className="flex-1 flex justify-center py-2">
                        <Link to="/" className="text-xl whitespace-nowrap text-hotpink">
                            nathanmelloul.com
                        </Link>
                    </div>


                    <div className="flex w-full justify-center flex-row lg:flex-1 gap-8 py-2">
                        <ul className="flex flex-row items-center gap-4 lg:gap-8">
                            {navLinks.map((link) => (
                                <li key={link.id} className="text-gray-400 hover:text-hotpink">
                                    <a href={`#${link.id}`}>{link.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="hidden items-center justify-center">
                        <div className="flex text-white items-center justify-center text-nowrap h-12 px-4 w-auto rounded-full bg-hotpink hover:bg-hotpink focus:ring-4 focus:ring-pink-500 focus:outline-none">
                            <a href="#contact">
                                <p>Say hello :)</p>
                            </a>
                        </div>
                    </div>






                </div>
            </div>
        </nav>
    )
}