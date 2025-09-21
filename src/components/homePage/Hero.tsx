"use client"
import ArrowWIcon from "@/assets/arrow-right.svg";
import HeroImage from '@/assets/abstract.png';
import HeroImageStar from '@/assets/star.png';
import { motion } from "framer-motion";
import { EarthBackground } from "./Earth";

import Image from "next/image";
import { useRouter } from "next/navigation";
export const Hero = () => {

    const router = useRouter();
    return <div className="bg-black text-white bg-[linear-gradient(to_bottom,#000,#200D42_34%,#4F21A1_65%,#A46EDB_82%)] py-[72px] sm:py-24 relative overflow-clip">
        <EarthBackground />

        <div className="absolute h-[375px] w-[750px] sm:w-[1536px] sm:h-[768px] lg:w-[2400px] lg:h-[1200px] rounded-[100%] bg-black left-1/2 -translate-x-1/2 border-[#B48CDE] bg-[radial-gradient(closest-side,#000_82%,#9560EB)] top-[calc(100%-96px)] sm:top-[calc(100%-120px)] z-10"></div>

        <div className="container relative mx-auto z-20">
            <div className="flex item-center justify-center">
                <a href="#" className="inline-flex gap-3 border py-1 px-2 rounded-lg border-white/30 relative z-30">
                    <span className=" bg-[linear-gradient(to_right,#F87AFF,#FB93D0,#FFDD99,#C3F0B2,#2FD8FE)] text-transparent bg-clip-text [-webkit-background-clip:text]">Version 1</span>
                    <span className="inline-flex gap-2 items-center text-white/80 hover:text-white transition">
                        <span>Read More</span>
                        <ArrowWIcon className="w-4 h-4" />
                    </span>

                </a>
            </div>
            <div className="flex justify-center mt-8">
                <div className="inline-flex relative">
                    <h1
                        className="
                         text-4xl sm:text-6xl md:text-7xl lg:text-9xl
    font-bold tracking-tighter text-center inline-flex
  "
                    >
                        MINDMATE
                    </h1>

                    <motion.div 
                        className="absolute -left-16 -top-32 hidden lg:inline z-10"
                        drag
                    >
                        <Image 
                            src={HeroImage} 
                            alt="" 
                            height="120" 
                            width="120" 
                            className="max-w-none lg:h-48 lg:w-48" 
                            draggable={false} 
                        />
                    </motion.div>
                    <motion.div 
                        className="absolute -top-12 -right-12 hidden lg:inline z-10"
                        drag
                        dragSnapToOrigin
                    >
                        <Image 
                            src={HeroImageStar} 
                            alt="" 
                            height="100" 
                            width="100" 
                            className="max-w-none lg:h-40 lg:w-40" 
                            draggable={false} 
                        />
                    </motion.div>
                </div>

            </div>
            <div className="flex justify-center">
                <p className="text-center text-xl mt-8 max-w-md">
                    MindMate is a safe space to share your feelings and connect with supportive listeners—anytime, anywhere.
                </p>
            </div>

            <div className="flex justify-center mt-8">
                <button onClick={() => router.push("/login")} className="bg-white text-black py-3 px-5 rounded-lg font-medium">Share now</button>
            </div>


        </div>

    </div>

}