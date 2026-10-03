import type { Material } from "../../services/materialService";

export const MOCK_MATERIALS: Material[] = [
  {
    id: 1,
    materialCode: "MAT-4140",
    name: "Acero SAE 4140 Bonificado",
    specification: "ASTM A29 / IRAM-IAS U500-4140 (28-32 HRC)",
    manufacturer: "Tenaris / Siderca",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-01-15T08:00:00Z",
  },
  {
    id: 2,
    materialCode: "MAT-BR65",
    name: "Bronce Fosforado SAE 65 (CuSn10P)",
    specification: "ASTM B505 / UNS C90700",
    manufacturer: "Bronces Argentinos S.A.",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-01-15T08:00:00Z",
  },
  {
    id: 3,
    materialCode: "MAT-7075",
    name: "Aluminio 7075-T6 Duraluminio",
    specification: "AMS 4045 / EN AW-7075",
    manufacturer: "Aluar Aluminio Argentino",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-01-15T08:00:00Z",
  },
  {
    id: 4,
    materialCode: "MAT-304L",
    name: "Acero Inoxidable AISI 304L",
    specification: "ASTM A276 / AISI 304L",
    manufacturer: "Acerbrag S.A.",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-01-15T08:00:00Z",
  },
];
