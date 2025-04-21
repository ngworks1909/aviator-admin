import Navbar from "../common/Navbar";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar/>
      <main className="flex-1 overflow-auto p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        This is dashboard
        </div>
      </main>
    </div>
  )
}
