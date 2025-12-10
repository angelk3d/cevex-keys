import { NextResponse } from 'next/server';

const keysDB = new Map();

export async function GET() {
  const now = new Date();
  const allKeys = Array.from(keysDB.entries());
  const activeKeys = allKeys.filter(([_, data]) => now < data.expiresAt);
  
  const stats = {
    total: allKeys.length,
    active: activeKeys.length,
    byService: {
      lootlabs: activeKeys.filter(([_, d]) => d.service === 'lootlabs').length,
      linkvertise: activeKeys.filter(([_, d]) => d.service === 'linkvertise').length,
      direct: activeKeys.filter(([_, d]) => d.service === 'direct').length
    },
    recentKeys: allKeys.slice(-5).map(([key, data]) => ({
      key,
      service: data.service,
      expires: data.expiresAt.toISOString()
    }))
  };
  
  return NextResponse.json(stats);
}
