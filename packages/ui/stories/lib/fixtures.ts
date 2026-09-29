const avatarUrl = (seed: number) => `https://i.pravatar.cc/80?img=${seed}`;

export const PEOPLE = [
  { id: "1", name: "Alex Morgan", imageUrl: avatarUrl(47) },
  { id: "2", name: "Sam Lee", imageUrl: avatarUrl(12) },
  { id: "3", name: "Jordan Park", imageUrl: avatarUrl(32) },
  { id: "4", name: "Riley Chen", imageUrl: avatarUrl(5) },
  { id: "5", name: "Casey Kim", imageUrl: null },
];

export const OPTION_LABELS = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];

export const OPTIONS = OPTION_LABELS.map((label) => ({ value: label.toLowerCase(), label }));

export const PEOPLE_OPTIONS = PEOPLE.map((person) => ({
  value: person.id,
  label: person.name,
  imageUrl: person.imageUrl,
}));
