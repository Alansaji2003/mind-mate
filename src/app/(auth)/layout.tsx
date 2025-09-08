import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link"
import Logo from '@/assets/logosaas.png';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center">
            <Link href="/" className={buttonVariants({
                variant: "outline",
                className: "absolute left-4 top-4"
            })}>
            <ArrowLeft className="size-4"/>
            Back
            </Link>

            <div className="flex w-full max-w-sm flex-col gap-6">
                <Link
                href="/" className="flex items-center gap-2 self-center font-medium text-white">
                    <Image width={32} height={32} src={Logo} alt="MINDMATE Logo"/>
                    MINDMATE.</Link>
                {children}
                <div className="text-balance text-center text-xs text-white">
                    By clicking to continue, you agree to our <span className="hover:text-white hover:underline">Terms of service</span>{" "} and <span className="hover:text-white hover:underline">Privacy policy</span>.
                </div>
            </div>
            <script src="https://accounts.google.com/gsi/client" async></script>
        </div>

    );
}
