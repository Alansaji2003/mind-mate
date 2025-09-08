import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive"
import { SectionCards } from "@/components/sidebar/section-cards"
import { ActiveConversations } from "@/components/ActiveConversations"

export default function DashboardPage() {
  return (
    <>
      <SectionCards />
      <ActiveConversations />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </>
  )
}
