import { CircleStatus } from "./abi";

export const circleStatusLabels: Record<number, string> = {
  [CircleStatus.Created]: "Filling up",
  [CircleStatus.Active]: "Active",
  [CircleStatus.Finished]: "Finished",
  [CircleStatus.Cancelled]: "Cancelled",
};

export const circleStatusStyles: Record<number, string> = {
  [CircleStatus.Created]: "bg-warn/10 text-warn",
  [CircleStatus.Active]: "bg-positive/10 text-positive",
  [CircleStatus.Finished]: "bg-ink/10 text-ink/70",
  [CircleStatus.Cancelled]: "bg-negative/10 text-negative",
};
