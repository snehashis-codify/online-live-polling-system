import type { pollStatusEnum } from "../../../common/config/schema.js";

export const isPollOpen = (
  expTime: Date | null,
  status: (typeof pollStatusEnum)["enumValues"][number],
) => {
  return (
    status === "active" && expTime !== null && expTime.getTime() > Date.now()
  );
};
