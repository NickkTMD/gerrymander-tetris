/**
 * Curated set of the most gerrymandered congressional districts used as game pieces.
 * Selected from the top gerrymandered states (by efficiency gap / partisan advantage)
 * and filtered for interesting, non-rectangular shapes that make good Tetris pieces.
 */

export interface FeaturedDistrictInfo {
  nickname?: string;
  reason: string;
  party: 'R' | 'D';
}

/** 25 curated district IDs drawn from the most gerrymandered states */
export const FEATURED_DISTRICT_IDS: string[] = [
  // Texas (+5.6R) — most gerrymandered state
  'd4833', // TX-33: DFW packing
  'd4835', // TX-35: San Antonio–Austin corridor
  'd4818', // TX-18: Houston tentacles
  'd4829', // TX-29: Houston Hispanic carve-out
  // North Carolina (+4.1R)
  'd3703', // NC-03: Eastern NC vote dilution
  'd3713', // NC-13: Converted D→R seat
  // Florida (+4.1R)
  'd1213', // FL-13: Tampa Bay carve-out
  // California (+2.8D)
  'd0641', // CA-41: Inland Empire carve
  'd0645', // CA-45: Orange County pack
  // Illinois (+2.3D)
  'd1704', // IL-04: "The Earmuffs"
  'd1705', // IL-05: Chicago crescent
  'd1703', // IL-03: Chicago staircase
  'd1717', // IL-17: Western IL stretch
  // Ohio (+1.8R)
  'd3909', // OH-09: "Snake by the Lake"
  // New Jersey (+1.4D)
  'd3406', // NJ-06: Central Jersey stretch
  // Georgia (+1.7R)
  'd1313', // GA-13: Atlanta suburban sprawl
  // South Carolina (+1.2R)
  'd4506', // SC-06: Majority-minority district
  // Wisconsin (+1.4R)
  'd5503', // WI-03: Western WI stretch
  // Tennessee (+1.1R)
  'd4705', // TN-05: Nashville cracking
  'd4709', // TN-09: Memphis packing
  // Maryland
  'd2401', // MD-01: Eastern Shore gerrymander
  'd2403', // MD-03: "The Pterodactyl"
  // Louisiana
  'd2202', // LA-02: New Orleans voter packing
  // New York (+0.9D)
  'd3624', // NY-24: Upstate stretch
  // Missouri (+1.0R)
  'd2903', // MO-03: St. Louis suburban carve
];

/** Educational metadata for each featured district */
export const FEATURED_DISTRICT_INFO: Record<string, FeaturedDistrictInfo> = {
  'd4833': { reason: 'Dallas-Fort Worth packing concentrates Democratic voters', party: 'R' },
  'd4835': { nickname: 'The Corridor', reason: 'Stretches 100 miles from San Antonio to Austin along I-35', party: 'R' },
  'd4818': { reason: 'Houston urban cracking with tentacle-like extensions', party: 'R' },
  'd4829': { reason: 'Hispanic community carve-out in Houston', party: 'R' },
  'd3703': { reason: 'Eastern NC drawn to dilute minority voting power', party: 'R' },
  'd3713': { reason: 'Redrawn mid-decade to convert a Democratic seat to Republican', party: 'R' },
  'd1213': { reason: 'Tampa Bay area carved to split Democratic voters', party: 'R' },
  'd0641': { reason: 'Inland Empire carved through Democratic-leaning communities', party: 'D' },
  'd0645': { reason: 'Orange County packed with Democratic voters', party: 'D' },
  'd1704': { nickname: 'The Earmuffs', reason: 'Connects two Hispanic neighborhoods via a thin strip along I-294', party: 'D' },
  'd1705': { reason: 'Chicago crescent-shaped district packing Democratic voters', party: 'D' },
  'd1703': { reason: 'Chicago suburban staircase shape', party: 'D' },
  'd1717': { reason: 'Stretches across western Illinois connecting multiple cities', party: 'D' },
  'd3909': { nickname: 'Snake by the Lake', reason: 'Thin strip along Lake Erie from Toledo toward Cleveland', party: 'R' },
  'd3406': { reason: 'Central New Jersey stretch connecting Democratic pockets', party: 'D' },
  'd1313': { reason: 'Atlanta suburban sprawl reaching into rural areas', party: 'R' },
  'd4506': { reason: 'Majority-minority district with convoluted boundaries', party: 'R' },
  'd5503': { reason: 'Western Wisconsin stretch connecting disparate communities', party: 'R' },
  'd4705': { reason: 'Nashville cracked across multiple districts to dilute Democratic votes', party: 'R' },
  'd4709': { reason: 'Memphis packed into a single district', party: 'R' },
  'd2401': { reason: 'Eastern Shore gerrymandered to include western Maryland panhandle', party: 'D' },
  'd2403': { nickname: 'The Pterodactyl', reason: 'Sprawling shape described as a broken-winged pterodactyl', party: 'D' },
  'd2202': { reason: 'New Orleans voter packing into a single district', party: 'R' },
  'd3624': { reason: 'Upstate New York stretch connecting Democratic-leaning areas', party: 'D' },
  'd2903': { reason: 'St. Louis suburban carve splitting metro-area voters', party: 'R' },
};
