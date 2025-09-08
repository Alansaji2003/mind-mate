"use client"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Logo from '@/assets/logosaas.png';
import Image from 'next/image';
import MenuIcon from '@/assets/menu.svg'
import { authClient } from "@/lib/auth-client"
import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { UseSignOut } from "@/hooks/use-signout";


export const NavBar = () => {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const {
        data: session,

    } = authClient.useSession()
    const handleSignOut = UseSignOut();

    return <div className='bg-black relative z-50'>
        <div className='px-4'>
            <div className='py-4 flex items-center justify-between '>
                <div className='relative'>
                    <div className='absolute w-full top-2 bottom-0  blur-md'></div>
                    <Image src={Logo} alt="Logo" className='h-16 w-16 relative' />
                </div>

                {/* Hamburger — visible at <=450px */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="border border-white border-opacity-30 h-12 w-12 justify-center items-center rounded-lg hidden max-[450px]:flex touch-manipulation"
                >
                    <MenuIcon className="text-white h-7 w-7" />
                </button>


                {/* Nav — hidden at <=450px, flex otherwise */}
                <nav className="flex items-center gap-1 sm:gap-6 max-[493px]:gap-3 max-[450px]:hidden">
                    <a
                        className="text-white text-opacity-60 hover:text-opacity-100 transition"
                        href="#Home"
                    >
                        Home
                    </a>
                    <a
                        className="text-white text-opacity-60 hover:text-opacity-100 transition"
                        href="#Features"
                    >
                        Features
                    </a>
                    <a
                        className="text-white text-opacity-60 hover:text-opacity-100 transition"
                        href="#FAQs"
                    >
                        FAQs & Contact
                    </a>

                    {session ? (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button className="bg-white py-2 px-4 rounded-lg font-medium text-black relative z-10">
                                    {session.user.name}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)] z-50">

                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <button onClick={() => router.push("/login")} className="bg-white py-2 px-4 rounded-lg text-black relative z-10">Sign in</button>
                    )}
                </nav>



            </div>

            {/* Mobile Menu — only visible when hamburger is clicked and screen <=450px */}
            {isMobileMenuOpen && (
                <div className="border-t border-white border-opacity-30 py-4 max-[450px]:block hidden relative z-40">
                    <nav className="flex flex-col gap-4">
                        <a
                            className="text-white text-opacity-60 hover:text-opacity-100 transition px-4"
                            href="#Home"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </a>
                        <a
                            className="text-white text-opacity-60 hover:text-opacity-100 transition px-4"
                            href="#Features"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Features
                        </a>
                        <a
                            className="text-white text-opacity-60 hover:text-opacity-100 transition px-4"
                            href="#FAQs"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            FAQs & Contact
                        </a>

                        <div className="px-4 pt-2">
                            {session ? (
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button className="bg-white py-2 px-4 rounded-lg font-medium text-black w-full">
                                            {session.user.name}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)] z-50">
                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <button
                                    onClick={() => {
                                        router.push("/login");
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="bg-white py-2 px-4 rounded-lg text-black w-full"
                                >
                                    Sign in
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            )}

        </div>
    </div>
}