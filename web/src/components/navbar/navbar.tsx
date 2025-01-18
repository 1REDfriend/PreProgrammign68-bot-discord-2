import Link from "next/link";

export default function Navbar() {
    return(
        <div className="sticky flex justify-between items-center w-screen h-16 border-b-2 border-red-500 rounded-b-3xl px-10">
            <div className="text-xl font-semibold uppercase">
                <p>SpellBound 68's</p>
            </div>
            <div className="flex items-center justify-center text-white uppercase font-semibold space-x-2">
                <Link className="px-3 py-3 bg-red-400 border-red-500 border rounded-md" href={'#'}>Home</Link>
                <Link className="px-3 py-3 bg-red-400 border-red-500 border rounded-md" href={'#'}>Home</Link>
                <div className="w-12 h-12 bg-red-400 rounded-full">
                    
                </div>
            </div>
        </div>
    )
}