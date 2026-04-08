import { useBookingStore } from "@/lib/bookingStore";
import AnalyticsContent from "@/components/analytics/AnalyticsContent";

const Analytics = () => {
  const { bookings, properties } = useBookingStore();
  return <AnalyticsContent bookings={bookings} properties={properties} />;
};

export default Analytics;
