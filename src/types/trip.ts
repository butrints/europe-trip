/** Shared trip data schema. Every trip under src/trips/<slug>/ exports a `TripData`. */

export type LatLng = { lat: number; lng: number };

export type PlaceCategory =
  | 'sight' | 'view' | 'museum' | 'food' | 'cafe' | 'bar' | 'market' | 'xmas' | 'shop' | 'park' | 'station' | 'stay';

export interface Place {
  id: string;
  name: string;
  city: string;                // city id
  cat: PlaceCategory;
  pos: LatLng;
  blurb: string;               // one line, shown on cards
  about?: string[];            // paragraphs
  hours?: string;
  price?: string;
  duration?: string;
  stop?: string;               // nearest stop + lines, e.g. "Groenplaats · tram 3/5/9/15"
  book?: { url: string; label?: string; required?: boolean; note?: string };
  url?: string;
  address?: string;
  tips?: string[];
  tags?: string[];             // 'free' | 'must' | 'rainy' | 'evening' | 'romantic' | 'book'
  img?: string;
  imgCredit?: string;
  rating?: 1 | 2 | 3;          // 3 = must
}

export type StepMode = 'walk' | 'tram' | 'bus' | 'train' | 'metro' | 'ferry' | 'plane' | 'taxi';
export type OperatorKey = 'delijn' | 'nmbs' | 'ns' | 'gvb' | 'eurostar' | 'flibco';

export interface RouteStep {
  mode: StepMode;
  line?: string;               // '9', 'IC', 'Eurocity Direct'
  operator?: OperatorKey;
  direction?: string;          // headsign
  from?: string;
  to?: string;
  stops?: string[];            // intermediate stops; last = exit stop
  dur: string;                 // '6 min'
  note?: string;               // platform / exit / where to board
  ticket?: string;             // ticket instruction for this leg
  warn?: string;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  total: string;
  cost?: string;
  steps: RouteStep[];
  alternatives?: { title: string; detail: string }[];
  origin?: LatLng;
  dest?: LatLng;
}

export type ItemKind = 'flight' | 'transit' | 'sight' | 'food' | 'xmas' | 'free' | 'home' | 'shop' | 'note' | 'view';

export interface DayItem {
  id: string;
  time?: string;               // '09:30'
  end?: string;
  kind: ItemKind;
  title: string;
  sub?: string;
  placeId?: string;
  routeId?: string;
  notes?: string[];
  tags?: string[];
  optional?: boolean;
}

export interface Day {
  date: string;                // ISO
  title: string;
  city: string;
  summary: string;
  hero?: string;
  tags?: string[];
  sun?: { rise: string; set: string };
  items: DayItem[];
}

export interface City { id: string; name: string; country: string; pos: LatLng; tz: string }

export interface Operator {
  id: string;
  name: string;
  region: string;
  color: string;
  ink?: string;
  abbr: string;
  how: string[];
  fares: { label: string; price: string }[];
  links: { label: string; url: string }[];
  tips?: string[];
}

export interface LiveBoard { id: string; title: string; from: string; to: string }

export interface TripData {
  slug: string;
  title: string;
  kicker: string;
  flag: string;
  start: string;
  end: string;
  travellers: string[];
  cover?: string;
  cities: City[];
  base: {
    name: string;
    address?: string;
    pos: LatLng;
    note?: string;
    checkin?: string;
    checkout?: string;
    url?: string;
    confirmed: boolean;
  };
  places: Place[];
  routes: Route[];
  days: Day[];
  operators: Operator[];
  live?: LiveBoard[];
  weatherCities?: string[];
  info: {
    packing: string[];
    phrases: { nl: string; en: string; say: string }[];
    emergency: { label: string; value: string; url?: string }[];
    apps: { name: string; why: string; url?: string }[];
    facts: { label: string; value: string }[];
  };
}

export interface TripMeta {
  slug: string;
  title: string;
  kicker: string;
  flag: string;
  start: string;
  end: string;
  cover?: string;
  load: () => Promise<{ default: TripData }>;
}
