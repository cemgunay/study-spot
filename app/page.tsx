export default function Home() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] min-h-dvh p-8 sm:p-20 items-center justify-center">
            <header className="flex justify-center">
                <div>Header</div>
            </header>
            <main>
                <h1>Welcome to Study Spot</h1>
            </main>
            <footer className="flex justify-center">
                <div>Footer</div>
            </footer>
        </div>
    );
}