import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight">
        Trustless Escrow for Remote Work
      </h1>
      <p className="mt-4 text-gray-400 text-lg sm:text-xl max-w-xl">
        Built on Stellar's Soroban smart contract platform
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Link
          to="/create"
          className="bg-cyan-400 text-navy-900 font-semibold px-8 py-3 rounded-lg text-base hover:bg-cyan-300 transition-colors"
        >
          Create Agreement
        </Link>
        <Link
          to="/status"
          className="border border-cyan-400 text-cyan-400 font-semibold px-8 py-3 rounded-lg text-base hover:bg-cyan-400/10 transition-colors"
        >
          Check Status
        </Link>
      </div>
    </main>
  )
}

export default HomePage
