# Drug Reference

The student Drug Reference tab uses a dedicated A–Z medication reference list with name/topic search and persistent `?id=` links. References render their supplied summary and clinical sections, with highlighted caution sections, internal section links and source attribution. Raw generation fields, evidence objects and duplicate titles are not rendered. Clinical content is neither invented nor completed by the interface.

References without approved photos show small generic illustrations. Spray, vial/tablet and gas illustrations depend only on an explicit form in the reference title or dosage_form, not inferred pharmacology. Unspecified forms use a neutral reference illustration. These visuals are labelled “Illustration” in detail views; they are not product identification photos.

To attach a medication photo, use Super admin → Content Studio → Drug reference images. Locate the published reference, select a reviewed PNG/JPEG/WebP, add a caption and image credit, then Upload media. The existing scoped media API stores the attachment and audit event; students receive the stored/signed media URL. Captions and credits appear in the detail view. Missing/broken images fall back to the illustration. No real product photographs are bundled or generated automatically.
