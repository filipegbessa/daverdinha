import { render, screen } from "@testing-library/react";
import Page, { generateMetadata } from "./page";
import { getCoveredDeliveryZones } from "@/features/site/lib/delivery-zones";

jest.mock("@/features/site/lib/delivery-zones", () => ({
  getCoveredDeliveryZones: jest.fn(),
}));

const mockZones = getCoveredDeliveryZones as jest.Mock;

const renderPage = async () => render(await Page());

describe("/site preview — always renders the full institutional site", () => {
  const originalMode = process.env.SITE_MODE;

  beforeEach(() => {
    // /site precisa mostrar o site completo mesmo com `/` em "em breve".
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
      "Ateliê de plantas, vasos e oficinas no Rio de Janeiro",
    );
    expect(screen.getByText("Onde entregamos")).toBeInTheDocument();
    expect(screen.getByText("Onde estamos")).toBeInTheDocument();
    expect(screen.getByText("Perguntas frequentes")).toBeInTheDocument();
  });

  // Sem API de catálogo e agenda ainda, a cliente valida o layout com
  // exemplos — e a página avisa que são exemplos.
  it("shows labelled sample products and events while the API has none", async () => {
    await renderPage();

    expect(screen.getByText(/Prévia do site/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vaso Terracota M/ })).toHaveAttribute(
      "href",
      "/produtos/vasos/vaso-terracota-m",
    );
    expect(screen.getByText("Próximos eventos")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Oficina de terrário/ }).length).toBeGreaterThan(0);
  });

  it("points the logo back to /site, not to the coming-soon page", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: "Daverdinha" })).toHaveAttribute("href", "/site");
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
