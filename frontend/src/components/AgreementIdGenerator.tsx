import { useState } from 'react'
import { generateAgreementId } from '../lib/agreementId'
import { TruncatedAddress } from './TruncatedAddress'

export function AgreementIdGenerator() {
  const [agreementId, setAgreementId] = useState<string>('')
  const [showQR, setShowQR] = useState(false)

  const handleGenerate = () => {
    const newId = generateAgreementId()
    setAgreementId(newId)
    setShowQR(true)
  }

  const qrDataUrl = agreementId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(agreementId)}`
    : ''

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-navy-800 dark:bg-navy-800 light:bg-gray-50 rounded-lg border border-navy-700 dark:border-navy-700 light:border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-white light:text-gray-900 mb-4">
        Generate Agreement ID
      </h2>
      <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-6">
        Create a new cryptographically random Agreement ID to share between payer and payee.
      </p>

      <button
        onClick={handleGenerate}
        className="w-full bg-cyan-400 text-navy-900 font-semibold px-4 py-2.5 rounded-lg text-sm sm:text-base hover:bg-cyan-300 transition-colors mb-6"
      >
        Generate New ID
      </button>

      {agreementId && (
        <div className="space-y-4">
          <div className="p-3 bg-navy-700 dark:bg-navy-700 light:bg-gray-100 rounded-lg border border-navy-600 dark:border-navy-600 light:border-gray-300">
            <TruncatedAddress
              address={agreementId}
              chars={16}
              label="Agreement ID"
            />
          </div>

          {showQR && (
            <div className="p-4 bg-white rounded-lg flex justify-center">
              <img
                src={qrDataUrl}
                alt="Agreement ID QR Code"
                className="w-48 h-48"
              />
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 text-center">
            Share this ID or QR code with your counterparty to begin an agreement.
          </p>
        </div>
      )}
    </div>
  )
}
