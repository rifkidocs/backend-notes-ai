export const COLORS = [
  '#FF5733', 
  '#33FF57', 
  '#3357FF', 
  '#F033FF', 
  '#FF33A8', 
  '#33FFF5', 
  '#FF8C33', 
  '#8C33FF', 
  '#FF3333', 
  '#33FF99'
];

/**
 * Deterministic color picker based on userId
 * @param userId - Unique identifier for the user
 * @returns HEX color string
 */
export function getColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
