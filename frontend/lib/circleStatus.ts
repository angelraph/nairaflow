import { CircleStatus } from "./abi";

export const circleStatusLabels: Record<number, string> = {
  [CircleStatus.Created]: "Filling up",
  [CircleStatus.Active]: "Active",
  [CircleStatus.Finished]: "Finished",
  [CircleStatus.Cancelled]: "Cancelled",
};

// Pill styles. Mint is kept for genuinely live states, per the design reference.
export const circleStatusStyles: Record<number, string> = {
  [CircleStatus.Created]: "border-warn/40 bg-warn/10 text-warn",
  [CircleStatus.Active]: "border-positive/40 bg-positive/10 text-positive",
  [CircleStatus.Finished]: "border-white/20 bg-white/5 text-ink/70",
  [CircleStatus.Cancelled]: "border-negative/40 bg-negative/10 text-negative",
};
