import { CheckCircleIcon, LockIcon, ScaleIcon } from './icons'

/**
 * HowItWorks — step-by-step explanation of the Trellis escrow flow.
 *
 * SVG icons are imported from individual files in `./icons/` rather than
 * inlined here. This lets the bundler tree-shake unused icons and lets the
 * browser cache each icon asset independently (#95).
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="mt-20 max-w-2xl w-full">
      <h2
        id="how-it-works-heading"
        className="text-2xl font-bold text-white mb-8 text-center"
      >
        How It Works
      </h2>

      <ol className="space-y-6 text-left list-none">
        {/* Step 1 */}
        <li className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold text-sm"
          >
            1
          </div>
          <div>
            <h3 className="text-white font-bold mb-1">Create Agreement</h3>
            <p className="text-gray-400 text-sm">
              Define milestones, amounts, and the people involved. The payer authorizes
              and pays fees.
            </p>
          </div>
        </li>

        {/* Step 2 */}
        <li className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900"
          >
            <LockIcon size={16} color="#0A0E17" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-1">Lock Funds</h3>
            <p className="text-gray-400 text-sm">
              The payer deposits the agreed amount for each milestone into the contract.
            </p>
          </div>
        </li>

        {/* Step 3 */}
        <li className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900 font-bold text-sm"
          >
            3
          </div>
          <div>
            <h3 className="text-white font-bold mb-1">Submit Work</h3>
            <p className="text-gray-400 text-sm">
              The payee completes the work and submits proof (GitHub link, file, etc.).
            </p>
          </div>
        </li>

        {/* Step 4 */}
        <li className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900"
          >
            <CheckCircleIcon size={16} color="#0A0E17" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-1">Approve &amp; Release</h3>
            <p className="text-gray-400 text-sm">
              The payer reviews and approves. Funds are released to the payee on-chain.
            </p>
          </div>
        </li>

        {/* Step 5 — Dispute path */}
        <li className="flex gap-4">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-navy-900"
          >
            <ScaleIcon size={16} color="#0A0E17" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-1">Dispute (if needed)</h3>
            <p className="text-gray-400 text-sm">
              Either party can raise a dispute. A trusted resolver arbitrates and releases
              funds fairly.
            </p>
          </div>
        </li>
      </ol>
    </section>
  )
}

export default HowItWorks
