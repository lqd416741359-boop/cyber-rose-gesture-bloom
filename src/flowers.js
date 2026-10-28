export const FLOWERS = [{
  id: "tech-rose", name: "MECHANICAL ROSE", latin: "ROSA // CYBERNETICA", note: "Open your palm. Awaken the blue-gold core.",
  palette: ["#59e6ff", "#176fd4", "#07336f", "#ffd77a", "#fff3bd"], petalCount: 32, petalShape: "mechanical", leafHue: "#33c9df",
}];

export function getFlower(id) {
  return FLOWERS.find((flower) => flower.id === id) ?? FLOWERS[0];
}
