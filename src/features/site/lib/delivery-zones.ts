export interface DeliveryZone {
  zone: string;
  bairros: string[];
}

/**
 * The delivery areas shown on the public site, read from the API rather than
 * hardcoded here.
 *
 * This list used to be a handwritten transcription of how the owner
 * described her coverage ("Zona Sul, Centro, Zona Portuária e parte da Zona
 * Norte"), which meant the site advertised informal place names that aren't
 * bairros at all, and — worse — kept advertising them no matter what the
 * owner toggled in /admin/entregas. The bot answers from `covered` in the
 * database; now the site does too, so the two can't disagree.
 *
 * Failure returns an empty list on purpose: the section disappears rather
 * than promising an area nobody verified.
 */
export async function getCoveredDeliveryZones(): Promise<DeliveryZone[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];

  try {
    const response = await fetch(`${apiUrl}/delivery-locations/covered`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
