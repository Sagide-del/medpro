import ClinicalReferenceCardsManager from '../reference-cards/ClinicalReferenceCardsManager';

export default function InstitutionClinicalReferenceCardsManager() {
  return (
    <ClinicalReferenceCardsManager
      title="Clinical Reference Cards Manager"
      subtitle="Create and manage institution clinical reference cards."
      allowPublish={true}
    />
  );
}
