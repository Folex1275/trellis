import { useParams } from 'react-router-dom'

function AgreementStatusPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <main className="px-6 pt-16 pb-32 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Agreement Status</h1>
      {id ? (
        <p className="mt-3 text-gray-400 font-mono break-all">{id}</p>
      ) : (
        <p className="mt-3 text-gray-400">
          Look up an agreement by its 64-character hex ID.
        </p>
      )}
      <div className="mt-10 rounded-xl border border-navy-700 bg-navy-800/60 p-8 text-gray-500">
        The agreement status view lands here in a follow-up issue.
      </div>
    </main>
  )
}

export default AgreementStatusPage
