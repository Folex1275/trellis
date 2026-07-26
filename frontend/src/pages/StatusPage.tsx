import { useEffect, useState } from 'react';
import { useRoute, useNavigate as useNavigateRouter } from '../lib/router';
import type { Agreement, SorobanEvent } from '../lib/soroban';
import { sorobanServer } from '../lib/soroban';
import { useWallet } from '../lib/useWallet';
import { CONTRACT_ID } from '../lib/config';
import MilestoneRow from '../components/MilestoneRow';

export default function StatusPage() {
  const route = useRoute();
  const navigate = useNavigateRouter();
  const wallet = useWallet();

  const [agreementId, setAgreementId] = useState(route.params.id || '');
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [events, setEvents] = useState<SorobanEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter an agreement ID');
      return;
    }

    setLoading(true);
    setError(null);
    setAgreement(null);
    setEvents([]);

    try {
      navigate('/status', { id });

      // Query agreement using contract read call
      const agreement = await queryAgreement(id);
      setAgreement(agreement);

      // Query events
      const events = await queryEvents();
      setEvents(events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query agreement');
      setAgreement(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(agreementId);
  };

  useEffect(() => {
    if (route.params.id && !agreement) {
      const initialId = route.params.id;
      setAgreementId(initialId);
      handleQuery(initialId);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Agreement Status</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Agreement ID (hex format)"
              value={agreementId}
              onChange={(e) => setAgreementId(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-navy-700 border border-navy-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-cyan-400 text-navy-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </form>

        {agreement && (
          <>
            {/* Agreement Details */}
            <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6">Agreement Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Payer</p>
                  <p className="text-white font-mono text-sm break-all">{agreement.payer}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Payee</p>
                  <p className="text-white font-mono text-sm break-all">{agreement.payee}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Token</p>
                  <p className="text-white font-mono text-sm break-all">{agreement.token}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Dispute Resolver</p>
                  <p className="text-white font-mono text-sm break-all">{agreement.dispute_resolver}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Agreement ID</p>
                  <p className="text-white font-mono text-sm break-all">{agreement.agreement_id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Milestones</p>
                  <p className="text-white font-semibold">{agreement.milestones.length}</p>
                </div>
              </div>
            </div>

            {/* Milestones Table */}
            <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6">Milestones</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Proof</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreement.milestones.map((milestone) => (
                      <MilestoneRow
                        key={milestone.id}
                        milestone={milestone}
                        agreement={agreement}
                        wallet={wallet}
                        onUpdate={() => handleQuery(agreementId)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Event Feed */}
            <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6">Event History</h2>

              {events.length === 0 ? (
                <p className="text-gray-400">No events yet</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event, idx) => (
                    <div key={idx} className="border-l-4 border-cyan-400 pl-4 py-2">
                      <p className="text-cyan-400 font-semibold text-sm">{event.type}</p>
                      <p className="text-gray-400 text-sm">Ledger: {event.ledger}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

async function queryAgreement(agreementId: string): Promise<Agreement> {
  throw new Error(
    `Agreement query not yet fully implemented for ID: ${agreementId}. Use CLI: trellis status --agreement-id ${agreementId}`
  );
}

async function queryEvents(): Promise<SorobanEvent[]> {
  // Query events from Soroban RPC
  // This is a simplified implementation
  try {
    const events = await sorobanServer.getEvents({
      startLedger: 0,
      limit: 100,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
        },
      ],
    });

    return (events.events || []).map((event: any) => ({
      type: 'event',
      ledger: event.ledger,
      txHash: event.txHash,
      timestamp: Date.now(),
      data: {},
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}
