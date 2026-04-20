import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="md:grid relative flex items-center justify-center grid-cols-2 min-h-screen">
        <main className="flex items-center justify-center z-10 w-full h-full relative">
          {children}
        </main>
        <aside className="lg:relative absolute h-full w-full">
          <Image
            src="/img/tree.jpg"
            alt="tree"
            className="w-full h-full object-cover"
            fill
          />
          <div className="lg:hidden overlay bg-black/50 absolute inset-0 w-full h-full"></div>
        </aside>
      </div>
    </>
  );
}
