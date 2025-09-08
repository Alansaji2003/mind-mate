import { Feature } from "./Feature";

const features = [
    {
        title: "Anonymous & Safe",
        description: "Share your thoughts freely without revealing your identity. MindMate ensures complete privacy and security."
    },
    {
        title: "Instant Connections",
        description: "Get paired with a supportive listener in real time—no waiting rooms, just instant human connection."
    },
    {
        title: "Mood Tracking",
        description: "Log your feelings daily and visualize your emotional journey with simple, easy-to-read insights."
    }
]

export const Features = () => {
    return <div className="bg-black text-white py-[72px] sm:py-24">

        <div className="container mx-auto">
            <h2 className="text-center font-bold text-5xl sm:text-6xl tracking-tighter">Everything you need</h2>
            <div className="max-w-xl mx-auto">
                <p className="text-center mt-5 text-xl text-white/70 ">MindMate gives you the tools to open up, feel supported, and build a healthier state of mind.</p>
            </div>


         <div className="mt-16 flex flex-col md:flex-row gap-4">

                {features.map((feature, index) => (
                    <Feature key={index} index={index} feature={feature} />
                ))}
            </div>

        </div>

    </div>;
};
