import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerList from "@/components/customers/CustomerList";

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <CustomerList />
    </DashboardLayout>
  );
}
