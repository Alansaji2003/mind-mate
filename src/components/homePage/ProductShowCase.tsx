"use client";
import Image from "next/image";
import ProductImage from "@/assets/images/appScreen2.png";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";


export const ProductShowCase = () => {
    const appImage = useRef<HTMLImageElement>(null);
    const { scrollYProgress } = useScroll({
        target: appImage,
        offset: [
            'start end',
            'end end'
        ]
    });


    const rotateX = useTransform(scrollYProgress, [0, 1], [15, 0])
    const opacity = useTransform(scrollYProgress, [0, 1], [0.5, 1])

    return <div className="bg-black text-white bg-gradient-to-b from-black to-[#5D2CAB] py-[72px] sm:py-24">
        <div className="container mx-auto">
            <h2 className="text-center text-5xl sm:text-6xl font-bold tracking-tighter">
                Intutive interface
            </h2>
            <div className="max-w-xl mx-auto ">
                <p className="text-xl text-center text-white/70 mt-5 ">
                    Clean and intuitive interface showcasing our product’s powerful features in action.
                </p>
            </div>
            <motion.div
                style={{
                    opacity: opacity,
                    rotateX: rotateX,
                    transformPerspective: "800px",
                }}
            >
                <Image
                    src={ProductImage}
                    alt="Product Showcase"
                    className="mt-14 mx-auto w-full max-w-sm sm:max-w-md lg:max-w-4xl"
                    ref={appImage}
                />
            </motion.div>


        </div>

    </div>
};
