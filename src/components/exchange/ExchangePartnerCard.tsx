'use client';

interface ExchangePartner {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  exchangeRate: number;
  minAmount: number;
  maxAmount: number;
  rewardType: string;
  isActive: boolean;
}

interface ExchangePartnerCardProps {
  partner: ExchangePartner;
  userBalance: number;
  onExchange: (partnerId: string) => void;
}

export function ExchangePartnerCard({ partner, userBalance, onExchange }: ExchangePartnerCardProps) {
  const canAfford = userBalance >= partner.minAmount;

  return (
    <div className={`card-hover ${!canAfford || !partner.isActive ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-center gap-4 mb-4">
        {partner.logoUrl ? (
          <img
            src={partner.logoUrl}
            alt={partner.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-contain bg-white"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center">
            <span className="text-xl">🤝</span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-800">{partner.name}</h3>
          <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full capitalize">
            {partner.rewardType}
          </span>
        </div>
      </div>

      {partner.description && (
        <p className="text-sm text-gray-500 mb-4">{partner.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Exchange Rate</span>
          <span className="font-medium text-amber-600">{partner.exchangeRate} coins = ฿1</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Min / Max</span>
          <span className="text-gray-700">{partner.minAmount} - {partner.maxAmount} coins</span>
        </div>
      </div>

      <button
        onClick={() => onExchange(partner.id)}
        disabled={!canAfford || !partner.isActive}
        className={`w-full ${canAfford && partner.isActive ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
      >
        {!partner.isActive ? 'Unavailable' : !canAfford ? 'Not Enough Coins' : 'Exchange'}
      </button>
    </div>
  );
}
