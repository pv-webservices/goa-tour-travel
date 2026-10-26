export const business = {
  name: 'Fatima Tour and Travel',
  phone: '+918080643517',
  displayPhone: '+91 80806 43517',
  whatsapp: '918080643517',
  email: 'vaseem9823@gmail.com',
  location: 'Goa, India',
};

export function whatsapp(subject = 'a trip in Goa') {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(`Hello ${business.name}, I would like to enquire about ${subject}. Please share availability and pricing.`)}`;
}

export const nav = [
  ['Home', '/'],
  ['About Us', '/about/'],
  ['Our Vehicles', '/vehicles/'],
  ['Tour Packages', '/tour-packages/'],
  ['Services', '/services/'],
  ['Gallery', '/gallery/'],
  ['Contact Us', '/contact/'],
];

export interface Vehicle {
  slug: string;
  name: string;
  short: string;
  category: string;
  images: string[];
  /** True when the card uses a generated representative image instead of client photography. */
  representative?: boolean;
  description: string;
  uses: string[];
}
const photos = (prefix: string, numbers: number[]) => numbers.map((n) => `${prefix} img-${n}.jpeg`);
export const vehicles: Vehicle[] = [
  {
    slug: 'innova-crysta',
    name: 'Toyota Innova Crysta',
    short: 'Innova Crysta',
    category: 'MPV',
    images: photos('Toyota Crysta', [3, 1, 2, 4]),
    description:
      'Bring the family, take the scenic route. Enquire about an Innova Crysta for Goa sightseeing, airport journeys or a longer escape with your group.',
    uses: ['Family sightseeing', 'Airport transfers', 'Outstation journeys'],
  },
  {
    slug: 'innova-hycross',
    name: 'Toyota Innova Hycross',
    short: 'Innova Hycross',
    category: 'MPV',
    images: photos('Toyota Innova Hycross', [4, 8, 1, 2, 3, 5, 6, 7]),
    description:
      'A considered choice for family holidays and business travel. Share your route and group size to discuss an Innova Hycross booking with a driver.',
    uses: ['Family holidays', 'Corporate travel', 'Private Goa tours'],
  },
  {
    slug: 'ertiga',
    name: 'Maruti Suzuki Ertiga',
    short: 'Ertiga',
    category: 'MPV',
    images: photos('Maruti Ertiga', [3, 7, 1, 2, 4, 5, 6]),
    description:
      'From a day exploring Goa to a pre-planned pickup, enquire about the Ertiga for your family or small group journey.',
    uses: ['Local sightseeing', 'Family trips', 'Pickup and drop'],
  },
  {
    slug: 'dzire',
    name: 'Maruti Suzuki Dzire',
    short: 'Dzire',
    category: 'Sedan',
    images: photos('swift dezire', [3, 1, 5, 8, 6, 2, 4]),
    description:
      'Plan a private ride for local travel, a transfer or a sightseeing day. Tell us your pickup, destination and passenger count to discuss a Dzire booking.',
    uses: ['Individual travel', 'Airport transfers', 'Local journeys'],
  },
  {
    slug: 'glanza',
    name: 'Toyota Glanza',
    short: 'Glanza',
    category: 'Hatchback',
    images: photos('Toyota Glanza', [4, 1, 2, 3, 5]),
    description:
      'Explore Goa with a driver-included hatchback enquiry. The Glanza is an option to discuss for individual travel, local outings and transfers.',
    uses: ['Local outings', 'Individual travel', 'Pickup and drop'],
  },
  {
    slug: 'winger',
    name: 'Tata Winger',
    short: 'Winger',
    category: 'Group travel',
    images: photos('tata winger', [3, 2, 1, 4, 5, 6]),
    description:
      'Keep your group together for sightseeing, an event or an outstation journey. Explore the supplied exterior, interior and video before requesting your quote.',
    uses: ['Group sightseeing', 'Event transport', 'Outstation trips'],
  },
  {
    slug: 'tempo-traveller',
    name: 'Tempo Traveller',
    short: 'Tempo Traveller',
    category: 'Group travel',
    images: photos('force', [3, 4, 1, 2]),
    description:
      'For shared plans and bigger journeys, enquire about a Tempo Traveller. We can discuss your route, pickup points and group requirements.',
    uses: ['Group holidays', 'Temple tours', 'Conference travel'],
  },
  {
    slug: 'force-urbania',
    name: 'Force Urbania',
    short: 'Force Urbania',
    category: 'Group travel',
    images: photos('urbania', [3, 1, 2, 4, 6, 5]),
    description:
      'Travel together in a modern Force Urbania. Explore the supplied exterior and cabin photographs, then share your group size and route for a quote.',
    uses: ['Group transfers', 'Private tours', 'Business groups'],
  },
  {
    slug: 'fortuner',
    name: 'Toyota Fortuner',
    short: 'Fortuner',
    category: 'SUV',
    images: [],
    representative: true,
    description:
      'Discuss a Toyota Fortuner booking for a private trip, business journey or outstation route. Our team can share current photographs and booking details on request.',
    uses: ['Private travel', 'Business journeys', 'Outstation trips'],
  },
  {
    slug: 'bharatbenz-bus',
    name: 'BharatBenz 40-Seater Bus',
    short: 'BharatBenz Bus',
    category: 'Bus',
    images: photos('Bharat benz', [3, 2, 1, 4, 5, 6, 7]),
    description:
      'Plan transportation for a larger group with the listed 40-seater BharatBenz bus. Share your itinerary and pickup points for a tailored group travel quotation.',
    uses: ['Large group travel', 'Corporate events', 'Group sightseeing'],
  },
];

export interface Tour {
  slug: string;
  name: string;
  label: string;
  image: string;
  alt: string;
  description: string;
  stops: string[];
  price?: string;
  note: string;
}
export const tours: Tour[] = [
  {
    slug: 'south-goa',
    name: 'South Goa Tour',
    label: 'Heritage & culture',
    image: 'south-goa',
    alt: 'Historic white church architecture in Goa',
    description:
      'A little history, a little coastline, and a different side of Goa. Explore the city, Old Goa landmarks and spiritual stops with an itinerary shaped around your interests.',
    stops: [
      'Panjim City',
      'Miramar Beach',
      'Dona Paula Beach',
      'Basilica of Bom Jesus, Old Goa',
      'Se Cathedral',
      'Fontainhas',
      'Mangeshi Temple',
      'Balaji Temple',
      'Spice Plantation',
      'Boat Cruise',
    ],
    note: 'Discuss the route and preferred stops when booking. Cruise tickets, plantation visits and entry charges are not assumed to be included.',
  },
  {
    slug: 'north-goa',
    name: 'North Goa Tour',
    label: 'Beaches & forts',
    image: 'aguada',
    alt: 'Historic Fort Aguada in North Goa',
    description:
      'Discover Goa’s beachside spirit. Bring together coastal viewpoints, forts and favourite beach stops in a private sightseeing enquiry.',
    stops: [
      'Coco Beach / Dolphin Trip',
      'Fort Aguada',
      'Sinquerim Beach / Fort',
      'Candolim Beach',
      'Calangute Beach',
      'Baga Beach',
      'Anjuna Beach',
      'Chapora Fort',
      'Vagator Beach',
    ],
    note: 'The final route and stop order are agreed when booking. Dolphin trips and other activities require separate confirmation.',
  },
  {
    slug: 'south-goa-extreme',
    name: 'South Goa Extreme',
    label: 'The scenic escape',
    image: 'palolem',
    alt: 'Palolem Beach and coconut palms in South Goa',
    description:
      'Slow down and follow the coast. This southern escape brings together beaches and Cabo de Rama for travellers who want more time with the scenery.',
    stops: ['Palolem Beach', 'Agonda Beach', 'Cola Beach', 'Cabo de Rama Beach', 'Cabo de Rama Fort'],
    note: 'Share your preferred stops to plan a suitable route. Access and activities depend on local conditions; timings are confirmed with your quote.',
  },
  {
    slug: 'north-goa-extreme',
    name: 'North Goa Extreme',
    label: 'Beyond the familiar',
    image: 'arambol',
    alt: 'Sunset at Arambol Beach in North Goa',
    description:
      'Go a little further along Goa’s northern coastline. Make space for Morjim, Mandrem, Ashwem and Arambol on your next beach-filled day.',
    stops: ['Morjim Beach', 'Mandrem Beach', 'Ashwem Beach', 'Arambol Beach'],
    price: '₹3,500',
    note: 'Ask us to confirm what the quoted amount covers, the price basis, vehicle and any additional charges before booking.',
  },
  {
    slug: 'dudhsagar-waterfall',
    name: 'Dudhsagar Waterfall',
    label: 'Full-day package enquiry',
    image: 'dudhsagar',
    alt: 'Dudhsagar waterfall in Goa surrounded by forest',
    description:
      'Trade the coastline for a day around Goa’s green hinterland. Talk to us about planning a Dudhsagar Waterfall trip and the transport arrangements for your group.',
    stops: [
      'Share your travel date and pickup point',
      'Discuss transport and access arrangements',
      'Confirm your day plan before booking',
    ],
    note: 'Waterfall access is subject to applicable rules and local conditions. Jeep safari, entry fees and direct waterfall access are not promised or included unless expressly confirmed.',
  },
  {
    slug: 'temple-tours',
    name: 'Spiritual Journeys & Temple Tours',
    label: 'A journey with meaning',
    image: 'ai-temple-architecture',
    alt: 'Illustration of Goan temple architecture with a lamp tower at sunrise',
    description:
      'Plan a journey around the places that matter to you. Tell us which temples you would like to visit, your starting point and your group size.',
    stops: [
      'Choose your preferred temples',
      'Discuss your route and travel dates',
      'Request a driver-included vehicle quote',
    ],
    note: 'Gokarna and Mahadeshwara temple enquiries are welcome. Confirm the exact temple, destination and route with our team before booking. The image is an illustration of Goan temple architecture, not a photograph of either temple.',
  },
];

export const services = [
  {
    slug: 'taxi-and-rental',
    name: 'Taxi & Rental Services',
    label: 'Your day, your way',
    icon: 'car',
    image: 'fleet-innova-hycross',
    kind: 'vehicle',
    description:
      'A ride across town or a whole day of exploring. Enquire about a car with a driver for your plans in Goa.',
    details: [
      'Taxi pickup and drop',
      'Rental vehicles with drivers',
      'Private sightseeing',
      'Individual and family journeys',
    ],
    prompt: 'taxi and driver-included rental services',
    planning:
      'Share your pickup, destination and travel date. For day bookings, let us know your planned stops so we can discuss the most suitable duration.',
  },
  {
    slug: 'airport-transfers',
    name: 'Airport Pickup & Drop',
    label: 'A considered start to your trip',
    icon: 'plane',
    image: 'ai-airport-transfer',
    kind: 'scene',
    description:
      'Start planning before you land. Arrange an airport pickup or drop enquiry with the vehicle and space your journey needs.',
    details: [
      'Pre-booked pickup enquiries',
      'Airport drop enquiries',
      'Vehicle selection',
      'Driver-included transportation',
    ],
    prompt: 'an airport pickup or drop',
    planning:
      'Tell us your airport, flight date, pickup or drop address, passenger count and luggage needs. Confirm airport coverage, pickup arrangements and any waiting charges with your quote.',
  },
  {
    slug: 'outstation-travel',
    name: 'Outstation Travel',
    label: 'The road goes further',
    icon: 'route',
    image: 'ai-outstation-highway',
    kind: 'scene',
    description:
      'Go beyond Goa. Discuss a pickup, drop or longer journey to Mumbai, Bengaluru, Pune or Hyderabad.',
    details: ['Mumbai', 'Bengaluru', 'Pune', 'Hyderabad'],
    prompt: 'outstation pickup and drop',
    planning:
      'Share your starting point, destination, journey dates and whether you need a one-way or return trip. Tolls, parking, distance limits and driver allowances are confirmed with the quote.',
  },
  {
    slug: 'corporate-travel',
    name: 'Corporate & Conference Travel',
    label: 'Bring your people together',
    icon: 'briefcase',
    image: 'ai-corporate-travel',
    kind: 'scene',
    description:
      'Transportation options for business meetings, corporate groups, conferences and professional travel requirements.',
    details: [
      'Business meeting travel',
      'Conference transportation',
      'Group pickup planning',
      'Vehicle and bus enquiries',
    ],
    prompt: 'corporate and conference transportation',
    planning:
      'Send the event date, guest count, pickup locations and schedule. Our team can discuss vehicle options and a quotation for your travel requirements.',
  },
  {
    slug: 'day-packages',
    name: 'Driver-Included Day Packages',
    label: 'Make room for your plans',
    icon: 'clock',
    image: 'palolem',
    kind: 'scenic',
    description:
      'Choose a booking duration around your plans, from a local outing to a day exploring the coast.',
    details: ['8-Hour Package', '12-Hour Package', '24-Hour Package', 'Full-Day Package'],
    prompt: 'a driver-included day package',
    planning:
      'Tell us your preferred duration, route and passenger count. Fuel, distance, tolls, parking, waiting time and driver allowances must be confirmed before booking.',
  },
  {
    slug: 'group-transport',
    name: 'Group Transportation',
    label: 'Good company. Shared journeys.',
    icon: 'users',
    image: 'fleet-tempo-traveller',
    kind: 'vehicle',
    description:
      'Travel together for family holidays, celebrations, sightseeing and organised group journeys.',
    details: [
      'Family and friends',
      'Event transportation',
      'Group sightseeing',
      'Traveller and bus enquiries',
    ],
    prompt: 'group transportation',
    planning:
      'Share your passenger count, luggage requirements and pickup points. Our team will discuss seating arrangements, vehicle options and availability.',
  },
];

export const faqs = [
  [
    'How do I enquire about a booking?',
    'Choose a tour, vehicle or service and use its enquiry button. You can also call us or prepare a WhatsApp enquiry on the contact page. Your booking is confirmed only after you agree the details with our team.',
  ],
  [
    'Can I book a vehicle with a driver?',
    'Yes. Driver-included booking enquiries are available for local travel, sightseeing, airport transfers, corporate travel and outstation journeys. Ask us about the vehicle and duration you need.',
  ],
  [
    'Which Goa tours can I enquire about?',
    'Explore South Goa Tour, North Goa Tour, South Goa Extreme and North Goa Extreme. Dudhsagar Waterfall and temple tour enquiries are also welcome. Your final route is agreed when booking.',
  ],
  [
    'Are vehicle prices shown online?',
    'Most journeys need a quote based on the vehicle, route, date and duration. Send us your plans for current pricing. Vehicle availability and specifications must be confirmed for your booking.',
  ],
  [
    'What does the North Goa Extreme price cover?',
    'The listed amount is ₹3,500. Please confirm the price basis, selected vehicle, inclusions and any additional charges with our team before booking.',
  ],
  [
    'Are fuel, tolls and entry tickets included?',
    'Inclusions are agreed with your quote. Do not assume that fuel, distance, tolls, parking, driver allowances, attraction tickets, cruises or other activities are included.',
  ],
  [
    'Can I arrange an airport pickup?',
    'Yes, you can enquire about an airport pickup or drop. Share your airport, flight date, pickup or drop address, passenger count and luggage needs so we can confirm arrangements.',
  ],
  [
    'Do you offer outstation travel?',
    'Outstation pickup and drop enquiries include Mumbai, Bengaluru, Pune and Hyderabad. Contact us to discuss your dates, route and whether you need a return journey.',
  ],
  [
    'What booking durations are available?',
    'Enquire about 8-hour, 12-hour, 24-hour and full-day driver-included bookings. Route, distance and all charges are agreed with your quotation.',
  ],
  [
    'What are the payment and cancellation terms?',
    'Ask our team for the payment, advance and cancellation terms that apply to your quote before confirming a booking. No standard policy is published here.',
  ],
];

export const serviceOptions = [
  'Goa Tour Packages',
  ...services.map((s) => s.name),
  'Temple Tours',
  'Dudhsagar Waterfall',
  'Other Travel Enquiry',
];

export function serviceImageAlt(s: (typeof services)[number]) {
  if (s.kind === 'vehicle') return `${s.name}: client-supplied vehicle photograph`;
  if (s.kind === 'scene') return `Illustrative scene for ${s.name.toLowerCase()}`;
  return 'Goa coastline scenery';
}

/** Place names taken from the tour itineraries above, used for the destination ribbon. */
export const destinations = [
  'Panjim',
  'Fort Aguada',
  'Calangute',
  'Baga',
  'Anjuna',
  'Chapora Fort',
  'Old Goa',
  'Fontainhas',
  'Palolem',
  'Agonda',
  'Cabo de Rama',
  'Morjim',
  'Mandrem',
  'Arambol',
  'Dudhsagar',
];

/** Figures derived from the catalogue above, not marketing claims. */
export const facts = [
  [String(vehicles.length), 'Vehicle types', 'From hatchbacks to a 40-seater bus'],
  [String(tours.length), 'Goa journeys', 'North, South, waterfall & temples'],
  ['4', 'Outstation cities', 'Mumbai, Bengaluru, Pune, Hyderabad'],
  ['8–24h', 'Booking durations', 'Driver-included day packages'],
];
