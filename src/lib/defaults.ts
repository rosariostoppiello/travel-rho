import type { Template } from "./types";

// Plantillas iniciales; después se editan y se guardan desde la app.
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "base-finde",
    name: "Finde corto",
    updatedAt: 0,
    items: [
      ...["DNI / pasaporte", "Tarjetas y algo de efectivo", "Cargador del celu", "Auriculares", "Llaves"].map(
        (text) => ({ list: "Mochila de mano", text }),
      ),
      { list: "Ropa", text: "Remeras", qty: 3 },
      { list: "Ropa", text: "Ropa interior", qty: 4 },
      { list: "Ropa", text: "Medias", qty: 4 },
      { list: "Ropa", text: "Pantalón / jean", qty: 2 },
      { list: "Ropa", text: "Buzo o campera liviana" },
      { list: "Ropa", text: "Pijama" },
      { list: "Ropa", text: "Zapatillas cómodas para caminar" },
      ...["Cepillo y pasta de dientes", "Desodorante", "Shampoo / acondicionador chico", "Protector solar", "Maquillaje", "Remedios de siempre", "Ibuprofeno"].map(
        (text) => ({ list: "Neceser", text }),
      ),
    ],
  },
  {
    id: "concierto",
    name: "Concierto",
    updatedAt: 0,
    items: [
      "Entrada (descargada, no depender de señal)",
      "DNI",
      "Power bank cargado + cable",
      "Riñonera o bolso chico cruzado",
      "Tapones para los oídos",
      "Efectivo para la salida",
      "Botella vacía (si dejan pasar)",
      "Campera atable a la cintura",
      "Zapatillas, nada de estrenar",
      "Pañuelitos / alcohol en gel",
      "Punto de encuentro acordado si nos perdemos",
    ].map((text) => ({ list: "Concierto", text })),
  },
];
