'use client';

import { useState } from 'react';

interface ReferralCodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ReferralCodeInput({ value, onChange }: ReferralCodeInputProps) {
  const [expanded, setExpanded] = useState(!!value);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; referrerName?: string } | null>(null);

  const validateCode = async (code: string) => {
    if (!code || code.length < 6) {
      setValidation(null);
      return;
    }

    setValidating(true);
    try {
      const res = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const data = await res.json();
        setValidation({ valid: true, referrerName: data.referrerName });
      } else {
        setValidation({ valid: false });
      }
    } catch {
      setValidation({ valid: false });
    } finally {
      setValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setValidation(null);
  };

  const handleBlur = () => {
    if (value) {
      validateCode(value);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
      >
        Have a referral code?
      </button>
    );
  }

  return (
    <div className="space-y-2 animate-slide-up">
      <label className="block text-sm font-medium text-gray-700">
        Referral Code (Optional)
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className="input"
        placeholder="Enter referral code"
        maxLength={12}
      />
      {validating && (
        <p className="text-sm text-muted-foreground">Validating...</p>
      )}
      {validation && validation.valid && (
        <p className="text-sm text-green-600">
          Invited by {validation.referrerName}! You'll get 50 PlayCoins.
        </p>
      )}
      {validation && !validation.valid && (
        <p className="text-sm text-red-600">Invalid referral code</p>
      )}
    </div>
  );
}
