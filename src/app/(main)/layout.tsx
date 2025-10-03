export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 h-[calc(100vh-4rem)]">
            {children}
        </main>
    );
}
