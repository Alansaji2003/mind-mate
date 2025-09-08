"use client";

import Image from 'next/image'
import HelixImage from '@/assets/images/helix2.png'
import TubeImage from '@/assets/tube.png'
import InstaIcon from '@/assets/icons/insta.svg'
import TwitterIcon from '@/assets/icons/x-social.svg'
import LinkedInIcon from '@/assets/icons/linkedin.svg'
import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'

export const Footer = () => {
    const [atBottom, setAtBottom] = useState(false);
    const controls = useAnimation();

    useEffect(() => {
        const handleScroll = () => {
            const scrollPos = window.scrollY + window.innerHeight;
            const pageHeight = document.body.scrollHeight;

            if (scrollPos >= pageHeight - 5) {
                setAtBottom(true);
            } else {
                setAtBottom(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (atBottom) {
            controls.start({
                y: [0, -15, 0, 15, 0],
                transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            });
        } else {
            controls.start({ y: 0 }); // reset when not at bottom
        }
    }, [atBottom, controls]);

    return (
        <div className="relative bg-black text-white">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="h-full w-full bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-6 md:px-8">
               <div className="relative flex flex-col items-center justify-center min-h-48 py-8 gap-6">

                    {/* Left Helix image */}
                    <div className="hidden md:block absolute left-0 top-[-10px] -translate-y-1/2 z-10 select-none pointer-events-none">
                        <motion.div animate={controls}>
                            <Image src={HelixImage} alt="Helix" className="w-60 h-60 object-contain" draggable={false} />
                        </motion.div>
                    </div>

                    {/* Center text & socials */}
                    <div className="relative z-20 flex flex-col items-center gap-4">
                        <p className="text-sm text-gray-400">
                            © 2025 MINDMATE. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <InstaIcon className="w-6 h-6 hover:scale-110 hover:text-pink-500 transition-transform duration-200" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <TwitterIcon className="w-6 h-6 hover:scale-110 hover:text-blue-400 transition-transform duration-200" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                                <LinkedInIcon className="w-6 h-6 hover:scale-110 hover:text-blue-600 transition-transform duration-200" />
                            </a>
                        </div>
                    </div>

                    {/* Right Tube image */}
                    <div className="hidden md:block absolute right-0 top-[-10px] -translate-y-1/2 z-10 select-none pointer-events-none">
                        <motion.div animate={controls}>
                            <Image src={TubeImage} alt="Tube" className="w-40 h-40 object-contain" draggable={false} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
