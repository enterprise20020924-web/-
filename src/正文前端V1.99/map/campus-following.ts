import { campusRegions, campusLocations, type CampusRegion } from './campus-map-data';
import {
  campusCharacterHabits,
  getCampusCharacterCurrentVisit,
  type CampusCharacterHabit,
  type CampusCharacterVisit,
} from './campus-character-encounters';
import type { CampusSchedulePeriod } from './campus-character-schedule';

export interface CampusFollowedPerson {
  person: CampusCharacterHabit;
  region: CampusRegion;
  locationId?: number;
  unmappedPlace?: string;
  placeName: string;
  visit: CampusCharacterVisit;
}
export interface CampusFollowGroup {
  region: CampusRegion;
  people: CampusFollowedPerson[];
}

export const CAMPUS_FOLLOW_VISIBLE_LIMIT = 5;

interface FollowMarkerViewport {
  boardTop: number;
  boardLeft: number;
  boardWidth: number;
  boardHeight: number;
  width: number;
  height: number;
}
export interface CampusFollowMarkerPlacement {
  below: boolean;
  shiftX: number;
  offsetY: number;
}

export function resolveCampusFollowedPerson(
  name: string,
  period: CampusSchedulePeriod = 'daytime',
): CampusFollowedPerson | null {
  const person = campusCharacterHabits.find(person => person.name === name);
  if (!person) return null;
  const visit = getCampusCharacterCurrentVisit(person, period);
  const region = campusRegions.find(region => region.id === visit.region);
  if (!region) return null;
  const location = campusLocations.find(place => visit.ids.includes(place.id) && place.region.id === region.id);
  return {
    person,
    region,
    locationId: location?.id,
    unmappedPlace: location ? undefined : visit.place,
    placeName: location?.name ?? visit.place,
    visit,
  };
}

export function getCampusFollowMarkerPlacement(
  region: CampusRegion,
  view: FollowMarkerViewport,
  peopleCount: number,
): CampusFollowMarkerPlacement {
  const count = Math.max(1, Math.min(peopleCount, CAMPUS_FOLLOW_VISIBLE_LIMIT));
  const columns = count === 4 ? 2 : Math.min(count, 3);
  const rows = Math.ceil(count / columns);
  const faceSize = view.width <= 700 ? 48 : 56;
  const width = columns * (faceSize + 4) + 10;
  const height = rows * (faceSize + 4) + 10;
  const x = view.boardLeft + (region.anchor[0] / 1672) * view.boardWidth;
  const y = view.boardTop + (region.anchor[1] / 941) * view.boardHeight;
  const below = y < height + 24 && view.height - y > y;
  const desiredTop = below ? y + 16 : y - height - 16;
  // Keep all portraits inside a short viewport, while leaving off-screen regions off-screen.
  const visibleAnchor = x >= 0 && x <= view.width && y >= 0 && y <= view.height;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  return {
    below,
    shiftX: visibleAnchor ? clamp(x - width / 2, 8, view.width - width - 8) - (x - width / 2) : 0,
    offsetY: (visibleAnchor ? clamp(desiredTop, 8, view.height - height - 8) : desiredTop) - y,
  };
}
export function getCampusFollowedPeople(
  names: readonly string[],
  period: CampusSchedulePeriod = 'daytime',
): CampusFollowedPerson[] {
  return [...new Set(names)].flatMap(name => resolveCampusFollowedPerson(name, period) ?? []);
}
export function groupCampusFollowedPeople(people: readonly CampusFollowedPerson[]): CampusFollowGroup[] {
  return campusRegions.flatMap(region => {
    const members = people.filter(entry => entry.region.id === region.id);
    return members.length ? [{ region, people: members }] : [];
  });
}
