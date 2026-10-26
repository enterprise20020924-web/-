import { campusLocations, campusRegions } from './campus-map-data';
import { getCampusCharacterEncounters } from './campus-character-encounters';
import type { CampusSchedulePeriod } from './campus-character-schedule';

export interface CampusTravelDestination {
  key: string;
  name: string;
  regionId: string;
  locationId?: number;
  unmappedPlace?: string;
}

export interface CampusTravelDraft {
  destination: CampusTravelDestination;
  period: CampusSchedulePeriod;
  mode: 'specific' | 'random';
  personName: string | null;
  text: string;
}

export function getCampusTravelDestination(locationId: number): CampusTravelDestination | null {
  const location = campusLocations.find(location => location.id === locationId);
  return location
    ? { key: `place-${location.id}`, name: location.name, regionId: location.region.id, locationId: location.id }
    : null;
}

export function getCampusInteriorDestination(regionId: string, place: string): CampusTravelDestination | null {
  if (!campusRegions.some(region => region.id === regionId) || !place.trim()) return null;
  return { key: `interior-${regionId}-${place}`, name: place, regionId, unmappedPlace: place };
}

export function getCampusTravelCandidates(destination: CampusTravelDestination, period: CampusSchedulePeriod) {
  return getCampusCharacterEncounters(destination.regionId, destination.locationId, destination.unmappedPlace, period);
}

/** Roll once on confirmation; browsing, searching, and cancellation never select a random encounter. */
export function createCampusTravelDraft(
  destination: CampusTravelDestination,
  period: CampusSchedulePeriod,
  selectedName: string | null,
  random: () => number = Math.random,
): CampusTravelDraft {
  const candidates = getCampusTravelCandidates(destination, period);
  if (selectedName !== null && !candidates.some(entry => entry.person.name === selectedName)) {
    throw new Error('对方已不在这个地点，请重新选择。');
  }
  let personName = selectedName;
  if (selectedName === null && candidates.length) {
    const roll = random();
    const index = Math.max(
      0,
      Math.min(candidates.length - 1, Math.floor((Number.isFinite(roll) ? roll : 0) * candidates.length)),
    );
    personName = candidates[index].person.name;
  }
  const intent =
    selectedName !== null
      ? `专程去见${personName}。`
      : personName
        ? `随意逛逛，看看会不会偶遇${personName}。`
        : '随意逛逛，看看那里有什么。';
  return {
    destination,
    period,
    mode: selectedName === null ? 'random' : 'specific',
    personName,
    text: `我前往「${destination.name}」，${intent}`,
  };
}
