import { PassengerDashboard } from "@/components/passenger/PassengerDashboard";

interface PassengerDashboardPageProps {
  passengerId: string;
}

export function PassengerDashboardPage({ passengerId }: PassengerDashboardPageProps) {
  return <PassengerDashboard passengerId={passengerId} />;
}
