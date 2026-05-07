import { Suspense } from "react";
import { HubShell } from "@/components/Hub/HubShell";
import { RightRail } from "@/components/Hub/RightRail";
import { FeedView } from "@/components/Hub/FeedView";

export default function Page() {
  return (
    <Suspense>
      <HubShell rightRail={<RightRail />}>
        <FeedView initialBoardSlug="clips" />
      </HubShell>
    </Suspense>
  );
}
