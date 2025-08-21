import { Layout } from "@/components/layout";
import { ExperticiasManagement } from "@/components/experticias-management";

export function Experticias() {
  return (
    <Layout title="Gestión de Experticias" subtitle="Administración de tipos de experticia criminalística">
      <ExperticiasManagement />
    </Layout>
  );
}