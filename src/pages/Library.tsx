import { useEffect, useDeferredValue, useState } from 'react';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { DistrictFeature } from '../types/district';
import stateNames, { getDistrictLabel } from '../data/stateNames';
import DistrictCard from '../components/DistrictCard';
import { DISTRICT_PIECES } from '../data/generatedPieces';
import NavBar from '../components/NavBar';
import '../App.css';

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
  const [sortBy, setSortBy] = useState<'name' | 'score-desc' | 'score-asc'>('name');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(loadSelectedIds);

  function toggleDistrict(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const arr = [...next];
      localStorage.setItem('selectedDistricts', JSON.stringify(arr));
      console.log(`Selected districts (${arr.length}):`, JSON.stringify(arr));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    localStorage.removeItem('selectedDistricts');
    console.log('Selected districts (0): []');
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

  const query = deferredSearch.toLowerCase();
  const filtered = (query
    ? districts.filter((d) =>
        getDistrictLabel(d.properties.STATEFP, d.properties.CD119FP)
          .toLowerCase()
          .includes(query),
      )
    : [...districts]
  ).sort((a, b) => {
    if (sortBy === 'name') return 0; // already sorted by name
    const scoreA = DISTRICT_PIECES[`d${a.properties.GEOID}`]?.gerrymanderScore ?? 0;
    const scoreB = DISTRICT_PIECES[`d${b.properties.GEOID}`]?.gerrymanderScore ?? 0;
    return sortBy === 'score-desc' ? scoreB - scoreA : scoreA - scoreB;
  });

  return (
    <>
    <NavBar />
    <div className="library-page">
      <h1>District Library</h1>
      <div className="library-controls">
        <input
          className="library-search"
          type="text"
          placeholder="Search by state or district (e.g. California, District 14)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="library-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'score-desc' | 'score-asc')}
        >
          <option value="name">Sort: Name</option>
          <option value="score-desc">Sort: Most Gerrymandered</option>
          <option value="score-asc">Sort: Most Compact</option>
        </select>
      </div>
      <p>
        {query
          ? `Showing ${filtered.length} of ${districts.length}`
          : `${districts.length} congressional districts`}
        {selectedIds.size > 0 && (
          <>
            {' · '}{selectedIds.size} selected{' '}
            <button className="clear-selection-button" onClick={clearSelection}>
              Clear Selection
            </button>
          </>
        )}
      </p>
      <div className="library-grid" style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.15s' }}>
        {filtered.map((d) => (
          <DistrictCard
            key={d.properties.GEOID}
            feature={d}
            selected={selectedIds.has(`d${d.properties.GEOID}`)}
            onToggle={() => toggleDistrict(`d${d.properties.GEOID}`)}
          />
        ))}
      </div>
    </div>
    </>
  );
}
