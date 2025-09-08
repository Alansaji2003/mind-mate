import { Banner } from "@/components/homePage/Banner";
import { NavBar } from "@/components/homePage/NavBar";
import { Hero } from "@/components/homePage/Hero";
import { LogoTicker } from "@/components/homePage/LogoTicker";
import { Features } from "@/components/homePage/Features";
import { ProductShowCase } from "@/components/homePage/ProductShowCase";
import { FAQs } from "@/components/homePage/FAQs";
import { Footer } from "@/components/homePage/Footer";


export default function Home() {


    
  return <>
  
   <Banner />
   <NavBar />
   <Hero />
   <LogoTicker />
   <Features />
   <ProductShowCase />
   <FAQs />
   <Footer />
  
  </>;
  
}
