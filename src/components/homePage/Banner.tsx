export const Banner = () => {
    return (
        <div className="py-3 text-center bg-[linear-gradient(to_right,rgb(252,214,255,.7),rgb(41,216,255,.7),rgb(255,253,128,.7),rgb(248,154,191,.7),rgb(252,214,255,.7))] relative z-50">
            <div className="container mx-auto">
                <p className="font-medium">
                    <span className="font-bold hidden sm:inline text-black"> Share how you feel annonymously-</span>
                    <a href="/login" className="underline underline-offset-4 text-black relative z-10">
                        Join Now
                    </a>
                </p>

            </div>
        </div>

    );
};
