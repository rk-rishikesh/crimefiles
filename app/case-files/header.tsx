"use client";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
    return (
        <div className="flex justify-between items-center pt-20 md:pt-32 container mx-auto px-4 md:px-16">
            <div>
                <Link href="/">
                    <Image
                        className="cursor-pointer hidden lg:block"
                        src="/assets/logos/logo.svg"
                        width={150}
                        height={150}
                        alt="Randamu Logo"
                    />
                    <div className="lg:hidden justify-center items-center flex">
                        <Image
                            className="cursor-pointer "
                            src="/assets/logos/logo.svg"
                            width={150}
                            height={150}
                            alt="Randamu Logo"
                        />
                    </div>
                </Link>
            </div>
            <Link
                href="/case-files"
                className="font-funnel-display text-gray-700 hover:text-black border border-gray-200 px-4 py-2"
            >
                Open Cases
            </Link>
        </div>
    );
};

export default Header;



