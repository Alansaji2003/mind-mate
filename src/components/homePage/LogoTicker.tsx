"use client";
import acmeLogo from "@/assets/images/acme.png";
import quantumLogo from "@/assets/images/quantum.png";
import echoLogo from "@/assets/images/echo.png";
import celestialLogo from "@/assets/images/celestial.png"
import pulseLogo from "@/assets/images/pulse.png"
import apexLogo from '@/assets/images/apex.png'
import Image from "next/image";
import {motion} from "framer-motion"

const images = [
  { src: acmeLogo, alt: "acme logo" },
  { src: quantumLogo, alt: "quantum logo" },
  { src: echoLogo, alt: "echo logo" },
  { src: celestialLogo, alt: "celestial logo" },
  { src: pulseLogo, alt: "pulse logo" },
  { src: apexLogo, alt: "apex logo" },
];

export const LogoTicker = () => {
  return <div className="bg-black text-white py-[72px] sm:py-24 ">
    <div className="container mx-auto">
      <h2 className="text-xl text-center text-white/70">Trusted By</h2>
      <div className="flex overflow-hidden mt-9 before:content-[''] after:content-[''] before:absolute before:z-10 after:absolute before:h-full after:h-full before:w-5 after:w-5 relative after:right-0 before:left-0 before:top-0 after:top-0 before:bg-[linear-gradient(to_right,#000,rgb(0,0,0,0))] after:bg-[linear-gradient(to_left,#000,rgb(0,0,0,0))]">
        <motion.div initial={{translateX:0}} animate={{translateX:"-50%"}} transition={{duration:10,
          ease:"linear",
          repeat:Infinity
        }} className="flex gap-16 flex-none pr-16">
          {images.map((image, index) => (
            <Image key={index} src={image.src} alt={image.alt} className="flex-none h-8 w-auto" />
          ))}
          {images.map((image, index) => (
            <Image key={index} src={image.src} alt={image.alt} className="flex-none h-8 w-auto" />
          ))}
        </motion.div>
      </div>

    </div>
  </div>;
};
