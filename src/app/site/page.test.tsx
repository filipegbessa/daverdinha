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

const renderPage = async () => render(await Page());

describe("/site preview — always renders the full institutional site", () => {
  const originalMode = process.env.SITE_MODE;

  beforeEach(() => {
    // Nenhuma seção aqui lê SITE_MODE, mas a trava fica explícita: /site
    // precisa mostrar o site completo mesmo com `/` em "em breve".
    delete process.env.SITE_MODE;
    mockZones.mockClear();
    mockZones.mockResolvedValue([{ zone: "Centro", bairros: ["Gamboa"] }]);
  });

  afterEach(() => {
    if (originalMode === undefined) delete process.env.SITE_MODE;
    else process.env.SITE_MODE = originalMode;
  });

  it("renders the core institutional sections, not the coming-soon landing", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Um cantinho verde pra chamar de seu",
    );
    expect(screen.getByText("Onde entregamos")).toBeInTheDocument();
    expect(screen.getByText("Onde estamos")).toBeInTheDocument();
    expect(screen.getByText("Perguntas frequentes")).toBeInTheDocument();
  });

  it("renders the LocalBusiness JSON-LD script tag", async () => {
    const { container } = await renderPage();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
  });

  it("tells crawlers not to index this preview", () => {
    const metadata = generateMetadata();

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keeps the institutional title and OpenGraph image", () => {
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
