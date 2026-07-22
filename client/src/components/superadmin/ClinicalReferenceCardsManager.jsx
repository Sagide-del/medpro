import ClinicalReferenceCardsManager from '../reference-cards/ClinicalReferenceCardsManager';

export default function SuperAdminClinicalReferenceCardsManager() {
  return (
    <ClinicalReferenceCardsManager
      title="Clinical Reference Cards Manager"
      subtitle="Create and manage platform-wide clinical reference cards."
      allowPublish={true}
    />
  );
}
