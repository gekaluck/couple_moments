type PlaceHiddenInputsProps = {
  placeId?: string | null;
  placeName?: string | null;
  placeAddress?: string | null;
  placeWebsite?: string | null;
  placeOpeningHours?: string[] | null;
  placePhotoUrls?: string[] | null;
  placeLat?: number | null;
  placeLng?: number | null;
  placeUrl?: string | null;
};

export default function PlaceHiddenInputs({
  placeId,
  placeName,
  placeAddress,
  placeWebsite,
  placeOpeningHours,
  placePhotoUrls,
  placeLat,
  placeLng,
  placeUrl,
}: PlaceHiddenInputsProps) {
  return (
    <>
      <input type="hidden" name="placeId" value={placeId ?? ""} />
      <input type="hidden" name="placeName" value={placeName ?? ""} />
      <input type="hidden" name="placeAddress" value={placeAddress ?? ""} />
      <input type="hidden" name="placeWebsite" value={placeWebsite ?? ""} />
      <input
        type="hidden"
        name="placeOpeningHours"
        value={placeOpeningHours ? JSON.stringify(placeOpeningHours) : ""}
      />
      <input
        type="hidden"
        name="placePhotoUrls"
        value={placePhotoUrls ? JSON.stringify(placePhotoUrls) : ""}
      />
      <input
        type="hidden"
        name="placeLat"
        value={placeLat == null ? "" : placeLat.toString()}
      />
      <input
        type="hidden"
        name="placeLng"
        value={placeLng == null ? "" : placeLng.toString()}
      />
      <input type="hidden" name="placeUrl" value={placeUrl ?? ""} />
    </>
  );
}
