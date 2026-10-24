import { settleRounds } from "./api.mts";
export default async () => {
  await settleRounds();
};
export const config = { schedule: "* * * * *" };
