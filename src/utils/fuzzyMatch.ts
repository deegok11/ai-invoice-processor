import Fuse from 'fuse.js';
import type { Vendor, VendorMatchResult } from '../types';

export function fuzzyMatchVendor(extractedVendorName: string, vendors: Vendor[]): VendorMatchResult {
  if (!extractedVendorName.trim()) {
    return {
      vendorName: extractedVendorName,
      matchedVendor: '',
      confidence: 0,
      confirmed: false,
      overridden: false,
    };
  }

  const fuse = new Fuse<Vendor>(vendors, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'aliases', weight: 0.3 },
    ],
    includeScore: true,
    threshold: 0.8,
    ignoreLocation: true,
  });

  const results = fuse.search(extractedVendorName);

  if (results.length === 0) {
    return {
      vendorName: extractedVendorName,
      matchedVendor: '',
      confidence: 0,
      confirmed: false,
      overridden: false,
    };
  }

  const bestMatch = results[0];
  // Fuse.js score is 0 (perfect) to 1 (worst), convert to percentage
  const confidence = Math.round((1 - (bestMatch.score ?? 1)) * 100);

  return {
    vendorName: extractedVendorName,
    matchedVendor: bestMatch.item.name,
    confidence,
    confirmed: false,
    overridden: false,
  };
}

export function getAllVendorNames(vendors: Vendor[]): string[] {
  return vendors.map((v) => v.name);
}
