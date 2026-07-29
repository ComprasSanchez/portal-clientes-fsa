export interface FaqItem {
  id: string;
  question: string;
  answer: string | string[];
}

export interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "preguntas-frecuentes",
    title: "Preguntas frecuentes",
    items: [
      {
        id: "que-es-cora",
        question: "¿Qué es CORA?",
        answer:
          "CORA es el programa de acompañamiento de Farmacias Sánchez Antoniolli. CORA está para ayudarte a organizar tus compras recurrentes de farmacia, recordarte cuándo es momento de reponerlas y hacer que todo sea más simple.",
      },
      {
        id: "tiene-costo",
        question: "¿Tiene algún costo?",
        answer: "No, CORA es un servicio totalmente gratuito.",
      },
      {
        id: "quienes-pueden-sumarse",
        question: "¿Quiénes pueden sumarse?",
        answer:
          "Cualquier persona que realice compras recurrentes en Farmacias Sánchez Antoniolli. Por ejemplo, si comprás medicación todos los meses, métodos anticonceptivos, productos para tratamientos prolongados u otros productos de uso habitual, CORA puede acompañarte.",
      },
      {
        id: "como-me-sumo",
        question: "¿Cómo me sumo?",
        answer:
          "Podés sumarte en cualquier sucursal o comunicarte con nosotros por WhatsApp al 351-8173000 o llamando a nuestro Call Center 0800 888 4552.",
      },
      {
        id: "puedo-darme-de-baja",
        question: "¿Puedo darme de baja?",
        answer:
          "Sí. Cuando quieras. Solo tenés que escribirnos y vas a dejar de recibir las comunicaciones de CORA.",
      },
    ],
  },
  {
    id: "sobre-los-pedidos",
    title: "Sobre los pedidos",
    items: [
      {
        id: "que-hace-cora-por-mi",
        question: "¿Qué hace CORA por mí?",
        answer: [
          "Me recuerda cuándo se acerca la próxima reposición.",
          "Organiza mi pedido.",
          "Me permite agregar otros productos.",
          "Coordina la entrega.",
          "Me mantiene informado sobre el estado del pedido.",
        ],
      },
      {
        id: "tengo-que-pedir-todos-los-meses",
        question: "¿Tengo que pedir todos los meses?",
        answer:
          "No necesariamente. Cada vez que CORA te escriba, vos decidís si querés confirmar ese pedido o no.",
      },
      {
        id: "que-pasa-si-no-necesito-comprar",
        question: "¿Qué pasa si esta vez no necesito comprar?",
        answer:
          "No pasa nada. Simplemente podés no confirmar el pedido o indicarnos que por el momento no necesitás reponerlo.",
      },
      {
        id: "cambie-mi-tratamiento",
        question: "¿Qué pasa si cambié mi tratamiento o medicación?",
        answer:
          "Solo tenés que avisarnos. Actualizaremos tu información para acompañarte de la mejor manera.",
      },
      {
        id: "puedo-agregar-otros-productos",
        question: "¿Puedo agregar otros productos?",
        answer:
          "Sí. Cuando confirmes tu pedido también vas a poder agregar otros productos que necesites.",
      },
      {
        id: "puedo-cambiar-la-sucursal",
        question: "¿Puedo cambiar la sucursal donde retiro?",
        answer:
          "Sí, podés realizar el cambio desde el portal/link donde confirmás el pedido o a través de nuestros números de contacto.",
      },
      {
        id: "como-se-el-estado-de-mi-pedido",
        question: "¿Cómo sé el estado de mi pedido?",
        answer:
          "CORA te va avisando cada etapa del pedido hasta que esté listo para entregar. Vas a poder ver el seguimiento desde el mismo portal/link donde confirmaste el pedido.",
      },
    ],
  },
  {
    id: "comunicacion",
    title: "Comunicación",
    items: [
      {
        id: "por-que-me-escribio-cora",
        question: "¿Por qué me escribió CORA?",
        answer:
          "Porque estás adherido al programa y llegó el momento de organizar una nueva reposición.",
      },
      {
        id: "que-pasa-si-no-respondo",
        question: "¿Qué pasa si no respondo?",
        answer:
          "Si no respondés, CORA puede volver a escribirte para asegurarse de que hayas visto el recordatorio. Si ya no necesitás el servicio, siempre podés avisarnos.",
      },
      {
        id: "puedo-comunicarme-con-una-persona",
        question: "¿Puedo comunicarme con una persona?",
        answer:
          "Sí. Además de los mensajes automáticos, siempre podés comunicarte con nuestro equipo por WhatsApp o por teléfono.",
      },
    ],
  },
  {
    id: "beneficios",
    title: "Beneficios",
    items: [
      {
        id: "que-beneficios-tiene-cora",
        question: "¿Qué beneficios tiene CORA?",
        answer:
          "Además del acompañamiento y la organización de tus pedidos, podés acceder a: atención personalizada, comunicación exclusiva, acumulación de puntos, regalos y beneficios especiales (que corresponden al programa socioSA).",
      },
    ],
  },
  {
    id: "cora-responde",
    title: "CORA responde",
    items: [
      {
        id: "me-olvido-de-confirmar-el-pedido",
        question: "¿Y si me olvido de confirmar el pedido?",
        answer:
          "No te preocupes. Si pasa, voy a volver a escribirte para ayudarte a organizarlo.",
      },
      {
        id: "no-necesito-reponer-mi-medicacion",
        question: "¿Y si por un tiempo no necesito reponer mi medicación?",
        answer:
          "No pasa nada! Solo avisame y voy a adaptar mis recordatorios a tu situación.",
      },
      {
        id: "cambie-de-tratamiento",
        question: "¿Y si cambié de tratamiento?",
        answer:
          "Contame y actualizamos tu información para seguir acompañándote de la mejor manera.",
      },
    ],
  },
];
