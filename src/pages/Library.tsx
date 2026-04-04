import { useEffect, useDeferredValue, useState } from 'react';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { DistrictFeature } from '../types/district';
import stateNames, { getDistrictLabel } from '../data/stateNames';
import StateMap from '../components/StateMap';
import PixelCarousel from '../components/PixelCarousel';
import { DISTRICT_PIECES } from '../data/generatedPieces';
import { stateGerrymanderData } from '../data/stateGerrymanderScores';
import NavBar from '../components/NavBar';
import '../App.css';

interface StateGroup {
  fips: string;
  name: string;
  districts: DistrictFeature[];
}

function loadSelectedIds(): Set<string> {
  try {
    const raw = localStorage.getItem('selectedDistricts');
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

export default function Library() {
  const [districts, setDistricts] = useState<DistrictFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rank' | 'score-desc'>('rank');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(loadSelectedIds);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function toggleDistrict(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const arr = [...next];
      localStorage.setItem('selectedDistricts', JSON.stringify(arr));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    localStorage.removeItem('selectedDistricts');
  }

  useEffect(() => {
    fetch('/data/districts.topo.json')
      .then((res) => res.json())
      .then((topo: Topology) => {
        const objectName = Object.keys(topo.objects)[0];
        const fc = topojson.feature(topo, topo.objects[objectName]) as unknown as {
          type: 'FeatureCollection';
          features: DistrictFeature[];
        };

        const sorted = fc.features.sort((a, b) => {
          const stateA = stateNames[a.properties.STATEFP] ?? '';
          const stateB = stateNames[b.properties.STATEFP] ?? '';
          if (stateA !== stateB) return stateA.localeCompare(stateB);
          return parseInt(a.properties.CD119FP, 10) - parseInt(b.properties.CD119FP, 10);
        });

        setDistricts(sorted);
        setLoading(false);
      });
  }, []);

  const deferredSearch = useDeferredValue(search);
  const isStale = deferredSearch !== search;

  if (loading) {
    return (
      <>
      <NavBar />
      <div className="library-page">
        <h1>District Library</h1>
        <p>Loading districts…</p>
      </div>
      </>
    );
  }

  // Group districts by state
  const stateGroupMap = new Map<string, StateGroup>();
  for (const d of districts) {
    const fips = d.properties.STATEFP;
    if (!stateGroupMap.has(fips)) {
      stateGroupMap.set(fips, {
        fips,
        name: stateNames[fips] ?? fips,
        districts: [],
      });
    }
    stateGroupMap.get(fips)!.districts.push(d);
  }

  let stateGroups = Array.from(stateGroupMap.values());

  // Filter by search
  const query = deferredSearch.toLowerCase();
  if (query) {
    stateGroups = stateGroups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.districts.some(d =>
        getDistrictLabel(d.properties.STATEFP, d.properties.CD119FP)
          .toLowerCase()
          .includes(query)
      )
    );
  }

  // Sort states
  if (sortBy === 'rank') {
    stateGroups.sort((a, b) => {
      const rankA = stateGerrymanderData[a.fips]?.rank ?? 999;
      const rankB = stateGerrymanderData[b.fips]?.rank ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });
  } else if (sortBy === 'score-desc') {
    stateGroups.sort((a, b) => {
      const maxA = Math.max(...a.districts.map(d => DISTRICT_PIECES[`d${d.properties.GEOID}`]?.gerrymanderScore ?? 0));
      const maxB = Math.max(...b.districts.map(d => DISTRICT_PIECES[`d${d.properties.GEOID}`]?.gerrymanderScore ?? 0));
      return maxB - maxA;
    });
  } else {
    stateGroups.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalDistricts = stateGroups.reduce((sum, g) => sum + g.districts.length, 0);

  return (
    <>
    <NavBar />
    <div className="library-page">
      <h1>District Library</h1>
      <div className="library-controls">
        <input
          className="library-search"
          type="text"
          placeholder="Search by state or district (e.g. Texas, NC-03)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="library-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        >
          <option value="rank">Sort: Gerrymander Rank</option>
          <option value="name">Sort: State Name</option>
          <option value="score-desc">Sort: Highest District Score</option>
        </select>
      </div>
      <p className="library-summary">
        {query
          ? `Showing ${totalDistricts} districts in ${stateGroups.length} states`
          : `${totalDistricts} congressional districts across ${stateGroups.length} states`}
        {selectedIds.size > 0 && (
          <>
            {' · '}{selectedIds.size} selected{' '}
            <button className="clear-selection-button" onClick={clearSelection}>
              Clear Selection
            </button>
          </>
        )}
      </p>
      <div className="state-sections" style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.15s' }}>
        {stateGroups.map((group) => {
          const gData = stateGerrymanderData[group.fips];
          return (
            <section key={group.fips} className={`state-section${gData ? ' state-section-ranked' : ''}`}>
              <div className="state-header">
                <div className="state-header-left">
                  {gData && (
                    <span className={`state-rank-badge ${gData.party === 'R' ? 'rank-gop' : 'rank-dem'}`}>
                      #{gData.rank}
                    </span>
                  )}
                  <h2 className="state-name">{group.name}</h2>
                  <span className="state-district-count">{group.districts.length} district{group.districts.length !== 1 ? 's' : ''}</span>
                </div>
                {gData && (
                  <div className="state-header-right">
                    <span className={`state-advantage ${gData.party === 'R' ? 'advantage-gop' : 'advantage-dem'}`}>
                      +{gData.avgAdvantage.toFixed(1)} {gData.party === 'R' ? 'GOP' : 'Dem'} seats
                    </span>
                    <span className="state-metrics">
                      EG: {gData.effGap > 0 ? '+' : ''}{gData.effGap.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {gData && (
                <p className="state-description">{gData.description}</p>
              )}
              <div className="state-map-container">
                <StateMap
                  districts={group.districts}
                  selectedIds={selectedIds}
                  hoveredId={hoveredId}
                  onToggleDistrict={toggleDistrict}
                  onHoverDistrict={setHoveredId}
                />
              </div>
              <PixelCarousel
                districts={group.districts}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onClick={toggleDistrict}
                selectedIds={selectedIds}
              />
            </section>
          );
        })}
      </div>
    </div>
    </>
  );
}
