import { useBookingStore } from "@/lib/bookingStore";
import AnalyticsContent from "@/components/analytics/AnalyticsContent";
import AppLayout from "@/components/app/AppLayout";

const Analytics = () => {
  const { bookings, properties } = useBookingStore();
  return (
    <AppLayout>
      <AnalyticsContent bookings={bookings} properties={properties} />
    </AppLayout>
  );
};

export default Analytics;
