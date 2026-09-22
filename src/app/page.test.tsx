import { render, screen } from "@testing-library/react";
import Page, { generateMetadata } from "./page";
import { getCoveredDeliveryZones } from "@/features/site/lib/delivery-zones";

// Hero is an async Server Component (fetches active hero slides) — RTL can't
// resolve a nested async component synchronously, so it's mocked here. Hero has
// its own dedicated tests (Hero.test.tsx) covering the fetch/fallback/carousel logic.
jest.mock("@/features/site/components/Hero", () => ({
  Hero: () => <h1>Um cantinho verde pra chamar de seu</h1>,
}));

jest.mock("@/features/site/lib/delivery-zones", () => ({
  getCoveredDeliveryZones: jest.fn(),
}));

const mockZones = getCoveredDeliveryZones as jest.Mock;

// Page itself is an async Server Component now, so it's awaited into an
// element tree before handing it to RTL.
const renderPage = async () => render(await Page());

const originalMode = process.env.SITE_MODE;

afterEach(() => {
  if (originalMode === undefined) delete process.env.SITE_MODE;
  else process.env.SITE_MODE = originalMode;
});

describe("Home page — full site (SITE_MODE=full)", () => {
  beforeEach(() => {
    process.env.SITE_MODE = "full";
    mockZones.mockResolvedValue([{ zone: "Centro", bairros: ["Gamboa"] }]);
  });

  it("renders the core static sections", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Um cantinho verde pra chamar de seu",
    );
    expect(screen.getByText("Onde entregamos")).toBeInTheDocument();
    expect(screen.getByText("Onde estamos")).toBeInTheDocument();
    expect(screen.getByText("Perguntas frequentes")).toBeInTheDocument();
    expect(screen.getAllByText("Daverdinha").length).toBeGreaterThan(0);
  });

  it("renders the LocalBusiness JSON-LD script tag", async () => {
    const { container } = await renderPage();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
  });

  it("feeds the covered zones into the structured data Google reads", async () => {
    mockZones.mockResolvedValue([
      { zone: "Centro", bairros: ["Gamboa"] },
      { zone: "Zona Sul", bairros: ["Botafogo"] },
    ]);

    const { container } = await renderPage();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(JSON.parse(script!.innerHTML).areaServed).toEqual([
      "Centro",
      "Zona Sul",
    ]);
  });

  it("drops the delivery section when nothing is covered, and advertises no area", async () => {
    mockZones.mockResolvedValue([]);

    const { container } = await renderPage();

    expect(screen.queryByText("Onde entregamos")).not.toBeInTheDocument();
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(JSON.parse(script!.innerHTML).areaServed).toEqual([]);
  });

  it("keeps the institutional title and advertises the logo as the OpenGraph image", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe(
      "Daverdinha — Ateliê de plantas no Rio de Janeiro",
    );
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "Daverdinha — Ateliê de Plantas",
      },
    ]);
  });
});

describe("Home page — coming soon (SITE_MODE unset)", () => {
  beforeEach(() => {
    delete process.env.SITE_MODE;
    // Clears call history left by the 'full' describe above — jest isn't
    // configured with clearMocks/resetMocks, so without this the "never
    // calls the delivery API" assertion below would see stale calls from
    // earlier tests instead of verifying this mode's own behavior.
    mockZones.mockClear();
    mockZones.mockResolvedValue([{ zone: "Centro", bairros: ["Gamboa"] }]);
  });

  it("renders the coming-soon landing instead of the institutional sections", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Nosso site está chegando",
    );
    expect(screen.queryByText("Onde entregamos")).not.toBeInTheDocument();
    expect(screen.queryByText("Perguntas frequentes")).not.toBeInTheDocument();
  });

  it("never calls the delivery API — the landing must not depend on the backend being up", async () => {
    await renderPage();

    expect(mockZones).not.toHaveBeenCalled();
  });

  it("still emits the LocalBusiness JSON-LD, advertising no served area", async () => {
    const { container } = await renderPage();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const json = JSON.parse(script!.innerHTML);
    expect(json.name).toBe("Daverdinha");
    expect(json.telephone).toBe("5521986509259");
    expect(json.areaServed).toEqual([]);
  });

  it("keeps the WhatsApp and Instagram links reachable", async () => {
    await renderPage();

    expect(
      screen.getByRole("link", { name: "Falar no WhatsApp" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5521986509259"),
    );
    expect(
      screen.getByRole("link", { name: "@daverdinha_" }),
    ).toBeInTheDocument();
  });

  it('titles the page "Em breve" and repeats every OpenGraph field, since metadata merges shallowly', () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe("Daverdinha — Em breve");
    expect(metadata.openGraph?.title).toBe("Daverdinha — Em breve");
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.openGraph).toHaveProperty("type", "website");
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "Daverdinha — Ateliê de Plantas",
      },
    ]);
  });
});
