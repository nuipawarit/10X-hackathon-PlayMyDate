'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MerchantUser {
  id: string;
  merchantId: string;
  email: string;
  displayName: string | null;
  role: string;
}

interface Merchant {
  name: string;
  status: string;
  tier: string;
}

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/b2b/auth/session', {
          credentials: 'include',
        });
        const data = await res.json();

        if (data.user) {
          setUser(data.user);
          setMerchant(data.merchant);
        } else if (pathname !== '/b2b/merchant-login') {
          router.replace('/b2b/merchant-login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (pathname !== '/b2b/merchant-login') {
          router.replace('/b2b/merchant-login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/b2b/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    setMerchant(null);
    router.replace('/b2b/merchant-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (pathname === '/b2b/merchant-login') {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: '/b2b/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/b2b/campaigns', label: 'Campaigns', icon: '📢' },
    { href: '/b2b/venues', label: 'Venues', icon: '📍' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/b2b/dashboard" className="font-bold text-xl">
              PlayMyDate <span className="text-primary">Business</span>
            </Link>
            <nav className="hidden md:flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-2 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{merchant?.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.displayName || user.email}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
