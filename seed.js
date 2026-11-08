'use strict';
// Datos iniciales: usuarios de ejemplo, facultades, carreras, materias y módulos.

// Plantillas de materias (se reutilizan en varias carreras; cada carrera recibe su propia copia editable)
const T = {
  'Matemáticas': {
    desc: 'Aritmética, álgebra, funciones, geometría y trigonometría para el examen de admisión.',
    modules: [
      ['Aritmética y números reales', 'Operaciones, fracciones, razones y porcentajes.', 'Repasa los conjuntos numéricos (N, Z, Q, R), las operaciones con fracciones y decimales, la regla de tres simple y compuesta y el cálculo de porcentajes. Practica la jerarquía de operaciones y simplifica antes de calcular.'],
      ['Álgebra y ecuaciones', 'Factorización, ecuaciones lineales y cuadráticas.', 'Domina la factorización (factor común, diferencia de cuadrados, trinomios), las ecuaciones lineales y cuadráticas, con la fórmula general x = (−b ± √(b² − 4ac)) / 2a, y los sistemas de dos ecuaciones con dos incógnitas.'],
      ['Funciones y gráficas', 'Función lineal, cuadrática, exponencial y logarítmica.', 'Identifica dominio y rango, interpreta la pendiente y la ordenada al origen de una recta, ubica el vértice de una parábola y recuerda las propiedades básicas de exponentes y logaritmos.'],
      ['Geometría plana y del espacio', 'Áreas, volúmenes, semejanza y Pitágoras.', 'Aplica el teorema de Pitágoras, las fórmulas de áreas de triángulos, círculos y polígonos, los volúmenes de prismas, cilindros y esferas, y los criterios de semejanza de triángulos.'],
      ['Trigonometría', 'Razones trigonométricas e identidades.', 'Define seno, coseno y tangente en el triángulo rectángulo, memoriza los valores de 30°, 45° y 60° y usa la identidad sen²θ + cos²θ = 1 para resolver problemas.'],
      ['Probabilidad y estadística básica', 'Media, mediana, moda y probabilidad simple.', 'Calcula medidas de tendencia central, interpreta tablas y gráficos de frecuencia y resuelve problemas de probabilidad simple con casos favorables sobre casos posibles.']
    ]
  },
  'Física': {
    desc: 'Mecánica, energía, calor y electricidad a nivel preuniversitario.',
    modules: [
      ['Cinemática', 'Movimiento rectilíneo uniforme y variado.', 'Distingue posición, desplazamiento, velocidad y aceleración. Usa v = d/t en el MRU y las ecuaciones v = v₀ + at y d = v₀t + ½at² en el MRUA, incluyendo caída libre y tiro vertical.'],
      ['Dinámica y leyes de Newton', 'Fuerzas, masa y aceleración.', 'Aplica las tres leyes de Newton, la relación F = m·a, el peso P = m·g y la fuerza de rozamiento. Dibuja siempre el diagrama de cuerpo libre antes de plantear las ecuaciones.'],
      ['Trabajo, energía y potencia', 'Conservación de la energía mecánica.', 'Calcula trabajo (W = F·d·cosθ), energía cinética (½mv²) y potencial (mgh), y aplica la conservación de la energía mecánica. La potencia es trabajo por unidad de tiempo.'],
      ['Calor y termodinámica', 'Temperatura, calor y cambios de estado.', 'Diferencia calor y temperatura, convierte entre °C, K y °F, usa Q = m·c·ΔT y comprende la dilatación térmica y los cambios de estado.'],
      ['Electricidad básica', 'Ley de Ohm y circuitos simples.', 'Relaciona voltaje, corriente y resistencia con V = I·R, calcula resistencias en serie y en paralelo y la potencia eléctrica P = V·I.']
    ]
  },
  'Química': {
    desc: 'Estructura de la materia, enlaces, nomenclatura, estequiometría y soluciones.',
    modules: [
      ['Materia y estructura atómica', 'Átomo, número atómico y configuración electrónica.', 'Describe protones, neutrones y electrones, distingue número atómico y número de masa, reconoce isótopos y escribe configuraciones electrónicas sencillas.'],
      ['Tabla periódica y enlaces', 'Periodicidad y tipos de enlace.', 'Ubica grupos y periodos, reconoce tendencias de electronegatividad y radio atómico y diferencia los enlaces iónico, covalente y metálico.'],
      ['Nomenclatura inorgánica', 'Óxidos, hidróxidos, ácidos y sales.', 'Nombra y formula óxidos, hidróxidos, ácidos y sales con las reglas de nomenclatura tradicional y de stock, identificando el estado de oxidación de cada elemento.'],
      ['Reacciones y estequiometría', 'Balanceo y cálculos con moles.', 'Balancea ecuaciones químicas, convierte entre gramos, moles y partículas (número de Avogadro: 6,022 × 10²³) y calcula reactivo limitante y rendimiento.'],
      ['Soluciones, ácidos y bases', 'Concentración y pH.', 'Calcula molaridad y porcentaje en masa, y utiliza la escala de pH (pH = −log[H⁺]) para clasificar soluciones ácidas, neutras y básicas.']
    ]
  },
  'Biología': {
    desc: 'Célula, genética, cuerpo humano y ecología.',
    modules: [
      ['La célula', 'Estructura y funciones celulares.', 'Compara células procariotas y eucariotas, describe los organelos principales y repasa la membrana, el transporte celular, la mitosis y la meiosis.'],
      ['Genética básica', 'ADN, genes y herencia mendeliana.', 'Explica la estructura del ADN, la replicación y la síntesis de proteínas, y resuelve cruces monohíbridos con cuadros de Punnett.'],
      ['Anatomía y fisiología humana', 'Principales sistemas del cuerpo.', 'Repasa los sistemas digestivo, circulatorio, respiratorio, nervioso y excretor: órganos que los forman y su función general.'],
      ['Ecología y biodiversidad', 'Ecosistemas, cadenas tróficas y conservación.', 'Distingue población, comunidad y ecosistema, construye cadenas y redes tróficas y analiza los efectos de la actividad humana en la biodiversidad.']
    ]
  },
  'Lenguaje y Comunicación': {
    desc: 'Ortografía, gramática, comprensión lectora, redacción y literatura.',
    modules: [
      ['Ortografía y puntuación', 'Acentuación, uso de letras y signos.', 'Aplica las reglas de acentuación (agudas, graves, esdrújulas), el uso de b/v, c/s/z, g/j y h, y los signos de puntuación: coma, punto, dos puntos y punto y coma.'],
      ['Gramática y sintaxis', 'Clases de palabras y oraciones.', 'Reconoce sustantivos, adjetivos, verbos y conectores, identifica sujeto y predicado y distingue oraciones simples, compuestas y subordinadas.'],
      ['Comprensión lectora', 'Idea principal, inferencias y vocabulario.', 'Lee el texto completo antes de responder, identifica la idea principal y las secundarias, deduce el significado de palabras por contexto y distingue hechos de opiniones.'],
      ['Redacción y tipos de texto', 'Párrafo, coherencia y cohesión.', 'Estructura párrafos con idea central y detalles, usa conectores para dar cohesión y diferencia textos narrativos, expositivos y argumentativos.'],
      ['Literatura hispanoamericana y boliviana', 'Géneros y obras representativas.', 'Reconoce los géneros literarios, las corrientes principales (romanticismo, modernismo, realismo) y a autores representativos de Hispanoamérica y de Bolivia.']
    ]
  },
  'Historia y Geografía de Bolivia': {
    desc: 'Historia, geografía y organización del Estado boliviano.',
    modules: [
      ['Culturas prehispánicas y colonia', 'Tiwanaku, Tahuantinsuyo y la Audiencia de Charcas.', 'Estudia las culturas andinas y amazónicas anteriores a la llegada de los españoles (como Tiwanaku), el dominio del Tahuantinsuyo y la organización colonial en la Audiencia de Charcas.'],
      ['Independencia y formación de la república', 'Proceso independentista y primeros años.', 'Repasa las rebeliones de 1809, la guerra de independencia y la declaración de la independencia el 6 de agosto de 1825, así como a sus principales protagonistas.'],
      ['Siglo XX: Chaco y Revolución Nacional', 'Hechos que marcaron el siglo XX.', 'Identifica las causas y consecuencias de la Guerra del Pacífico (1879–1884), la Guerra del Chaco (1932–1935) y la Revolución Nacional de 1952 con sus reformas.'],
      ['Geografía física y regiones', 'Andes, valles y llanos.', 'Describe las grandes regiones del país (altiplano, valles y llanos), sus climas, cuencas hidrográficas, principales ciudades y recursos naturales.'],
      ['Estado Plurinacional y Constitución', 'Organización política actual.', 'Comprende la Constitución Política del Estado de 2009, la organización en órganos del poder público, los derechos fundamentales y la división territorial.']
    ]
  },
  'Razonamiento Lógico': {
    desc: 'Series, analogías, lógica y resolución de problemas.',
    modules: [
      ['Series y sucesiones', 'Patrones numéricos, literales y gráficos.', 'Busca la regla de formación: diferencias constantes, razones, alternancia de dos series y combinaciones con operaciones. Anota las diferencias entre términos consecutivos.'],
      ['Razonamiento verbal y analogías', 'Relaciones entre palabras.', 'Reconoce relaciones de sinonimia, antonimia, causa-efecto, parte-todo y función en analogías, y completa oraciones con el término adecuado.'],
      ['Lógica proposicional', 'Conectivos y tablas de verdad.', 'Usa los conectivos (y, o, si… entonces, si y solo si), construye tablas de verdad y evalúa la validez de razonamientos simples.'],
      ['Problemas de edades, móviles y porcentajes', 'Planteo de ecuaciones a partir del texto.', 'Traduce el enunciado a ecuaciones, define bien las incógnitas, organiza los datos en tablas y verifica el resultado con las condiciones del problema.']
    ]
  },
  'Dibujo y Geometría': {
    desc: 'Trazos, proporciones, geometría descriptiva y perspectiva.',
    modules: [
      ['Trazos y proporciones', 'Línea, forma y proporción.', 'Practica trazos de líneas rectas y curvas, la construcción de figuras con regla y compás y el uso de escalas y proporciones.'],
      ['Geometría descriptiva básica', 'Vistas y proyecciones.', 'Representa sólidos simples en planta, alzado y perfil, y relaciona las vistas con la forma tridimensional del objeto.'],
      ['Perspectiva', 'Perspectiva con uno y dos puntos de fuga.', 'Construye cubos y volúmenes simples en perspectiva cónica con uno y dos puntos de fuga, cuidando la línea de horizonte.']
    ]
  }
};

const FACULTIES = [
  { name: 'Ingeniería y Tecnología', description: 'Formación en ciencias exactas aplicadas al diseño, construcción y optimización de sistemas, infraestructura y procesos.',
    careers: [
      ['Ingeniería Civil', 'Diseño y construcción de obras de infraestructura: caminos, puentes, edificaciones y sistemas de agua.', ['Matemáticas', 'Física', 'Química', 'Razonamiento Lógico']],
      ['Ingeniería de Sistemas', 'Desarrollo de software, redes, bases de datos y gestión de sistemas informáticos.', ['Matemáticas', 'Física', 'Razonamiento Lógico', 'Lenguaje y Comunicación']],
      ['Ingeniería Industrial', 'Optimización de procesos productivos, calidad y logística.', ['Matemáticas', 'Física', 'Química', 'Razonamiento Lógico']],
      ['Ingeniería Eléctrica', 'Generación, transmisión y uso eficiente de la energía eléctrica.', ['Matemáticas', 'Física', 'Química']],
      ['Ingeniería Química', 'Transformación de materias primas en productos mediante procesos químicos.', ['Matemáticas', 'Física', 'Química', 'Biología']]
    ] },
  { name: 'Ciencias de la Salud', description: 'Carreras orientadas al cuidado de la salud, la prevención y el tratamiento de enfermedades.',
    careers: [
      ['Medicina', 'Diagnóstico, tratamiento y prevención de enfermedades en las personas.', ['Biología', 'Química', 'Física', 'Lenguaje y Comunicación']],
      ['Odontología', 'Salud bucal: prevención, diagnóstico y tratamiento.', ['Biología', 'Química', 'Lenguaje y Comunicación']],
      ['Enfermería', 'Cuidado integral del paciente y promoción de la salud comunitaria.', ['Biología', 'Química', 'Lenguaje y Comunicación']],
      ['Bioquímica y Farmacia', 'Análisis clínicos, desarrollo y control de medicamentos.', ['Química', 'Biología', 'Matemáticas']]
    ] },
  { name: 'Ciencias Económicas y Financieras', description: 'Gestión de recursos, finanzas, contabilidad y análisis de la economía.',
    careers: [
      ['Administración de Empresas', 'Planificación, organización y dirección de organizaciones.', ['Matemáticas', 'Lenguaje y Comunicación', 'Razonamiento Lógico']],
      ['Contaduría Pública', 'Registro, control y auditoría de la información financiera.', ['Matemáticas', 'Lenguaje y Comunicación', 'Razonamiento Lógico']],
      ['Economía', 'Estudio de la producción, distribución y consumo de bienes y servicios.', ['Matemáticas', 'Historia y Geografía de Bolivia', 'Razonamiento Lógico']],
      ['Ingeniería Comercial', 'Gestión de negocios, marketing y finanzas empresariales.', ['Matemáticas', 'Lenguaje y Comunicación', 'Razonamiento Lógico']]
    ] },
  { name: 'Derecho y Ciencias Políticas', description: 'Estudio de las leyes, el Estado y la justicia para la defensa de los derechos y la vida en sociedad.',
    careers: [
      ['Derecho', 'Formación jurídica para ejercer como abogado, juez o asesor.', ['Lenguaje y Comunicación', 'Historia y Geografía de Bolivia', 'Razonamiento Lógico']],
      ['Ciencias Políticas', 'Análisis del poder, las instituciones y las políticas públicas.', ['Lenguaje y Comunicación', 'Historia y Geografía de Bolivia', 'Razonamiento Lógico']]
    ] },
  { name: 'Arquitectura y Diseño', departments: 'la-paz', description: 'Diseño de espacios, objetos y comunicación visual que combinan creatividad y técnica.',
    careers: [
      ['Arquitectura', 'Diseño y planificación de edificaciones y espacios urbanos.', ['Matemáticas', 'Dibujo y Geometría', 'Física', 'Lenguaje y Comunicación']],
      ['Diseño Gráfico', 'Comunicación visual: identidad, editorial, digital y publicidad.', ['Dibujo y Geometría', 'Lenguaje y Comunicación', 'Razonamiento Lógico']]
    ] },
  { name: 'Humanidades y Educación', description: 'Estudio de la persona, la sociedad, la comunicación y la enseñanza.',
    careers: [
      ['Psicología', 'Estudio de la conducta y los procesos mentales.', ['Biología', 'Lenguaje y Comunicación', 'Razonamiento Lógico']],
      ['Ciencias de la Educación', 'Formación de docentes y especialistas en procesos educativos.', ['Lenguaje y Comunicación', 'Historia y Geografía de Bolivia', 'Razonamiento Lógico']],
      ['Comunicación Social', 'Periodismo, comunicación institucional y producción de contenidos.', ['Lenguaje y Comunicación', 'Historia y Geografía de Bolivia', 'Razonamiento Lógico']]
    ] },
  { name: 'Ciencias Agrícolas y Pecuarias', departments: 'cochabamba', description: 'Producción de alimentos, manejo de recursos naturales y salud animal.',
    careers: [
      ['Ingeniería Agronómica', 'Producción agrícola sostenible y manejo de suelos y cultivos.', ['Biología', 'Química', 'Matemáticas']],
      ['Medicina Veterinaria y Zootecnia', 'Salud, producción y bienestar animal.', ['Biología', 'Química', 'Matemáticas']],
      ['Ingeniería en Industria de Alimentos', 'Procesamiento, conservación y control de calidad de alimentos.', ['Química', 'Biología', 'Matemáticas', 'Física']]
    ] }
];

Object.assign(T, {
 "Informática y Programación": {
  "desc": "Fundamentos de computación, lógica de programación y manejo de datos.",
  "modules": [
   [
    "Fundamentos de computación",
    "Hardware, software y sistemas numéricos.",
    "Distingue hardware y software, reconoce las partes de una computadora y practica la conversión entre los sistemas decimal, binario y hexadecimal."
   ],
   [
    "Lógica de programación",
    "Algoritmos, variables y estructuras de control.",
    "Describe algoritmos con pasos ordenados, usa variables, condicionales (si… entonces) y ciclos (mientras, para) y prueba cada algoritmo con ejemplos sencillos."
   ],
   [
    "Hojas de cálculo y datos",
    "Fórmulas, tablas y gráficos.",
    "Usa referencias de celdas, fórmulas básicas (suma, promedio, condicionales) y gráficos para organizar e interpretar datos."
   ]
  ]
 },
 "Inglés": {
  "desc": "Vocabulario, gramática y comprensión de lectura en inglés.",
  "modules": [
   [
    "Vocabulario y expresiones básicas",
    "Saludos, descripciones y vida cotidiana.",
    "Aprende vocabulario de familia, estudios, trabajo y lugares, y expresiones útiles para presentarte y preguntar información."
   ],
   [
    "Tiempos verbales",
    "Presente, pasado y futuro.",
    "Usa el presente simple y continuo, el pasado simple y el futuro (will y going to) en oraciones afirmativas, negativas e interrogativas."
   ],
   [
    "Comprensión de lectura",
    "Idea principal y vocabulario por contexto.",
    "Lee textos cortos, identifica la idea principal y deduce palabras desconocidas por el contexto y por su parecido con el español."
   ]
  ]
 },
 "Economía y Contabilidad Básica": {
  "desc": "Conceptos económicos, registros contables y matemática financiera.",
  "modules": [
   [
    "Conceptos económicos básicos",
    "Escasez, oferta y demanda.",
    "Explica la escasez y el costo de oportunidad, y analiza cómo cambian el precio y la cantidad cuando varían la oferta o la demanda."
   ],
   [
    "Ecuación contable y registros",
    "Activo, pasivo y patrimonio.",
    "Aplica la ecuación Activo = Pasivo + Patrimonio, clasifica cuentas y registra operaciones simples por partida doble (debe y haber)."
   ],
   [
    "Matemática financiera básica",
    "Interés simple, compuesto y porcentajes.",
    "Calcula interés simple (I = C·i·t) y compuesto, descuentos y variaciones porcentuales aplicados a precios y préstamos."
   ]
  ]
 },
 "Educación Cívica y Derechos": {
  "desc": "Derechos, deberes, organización del Estado y participación ciudadana.",
  "modules": [
   [
    "Derechos y deberes ciudadanos",
    "Derechos fundamentales y garantías.",
    "Distingue los derechos civiles, políticos, sociales y colectivos, y los deberes de las personas según la Constitución Política del Estado."
   ],
   [
    "Organización del Estado",
    "Órganos del poder público.",
    "Identifica las funciones de los órganos Legislativo, Ejecutivo, Judicial y Electoral, y los niveles de organización territorial."
   ],
   [
    "Participación y democracia",
    "Formas de democracia y control social.",
    "Diferencia la democracia directa y participativa, la representativa y la comunitaria, y reconoce los mecanismos de participación y control social."
   ]
  ]
 },
 "Filosofía y Ética": {
  "desc": "Grandes preguntas, corrientes filosóficas y valores.",
  "modules": [
   [
    "Introducción a la filosofía",
    "Ramas y grandes preguntas.",
    "Reconoce las ramas de la filosofía (lógica, ética, metafísica, epistemología) y las preguntas centrales de cada una."
   ],
   [
    "Corrientes filosóficas",
    "De los griegos a la época moderna.",
    "Ubica a Sócrates, Platón y Aristóteles, y las ideas centrales del racionalismo y del empirismo."
   ],
   [
    "Ética y valores",
    "Moral, normas y dilemas.",
    "Diferencia ética y moral, valores y normas, y analiza dilemas sencillos de la vida cotidiana y profesional."
   ]
  ]
 },
 "Historia del Arte y Diseño": {
  "desc": "Movimientos artísticos, arte andino, color y composición.",
  "modules": [
   [
    "Arte antiguo y medieval",
    "De la prehistoria al gótico.",
    "Reconoce las características del arte prehistórico, egipcio, griego, romano, románico y gótico, y sus obras más representativas."
   ],
   [
    "Arte moderno y contemporáneo",
    "Movimientos desde el Renacimiento.",
    "Identifica el Renacimiento, el Barroco, el Impresionismo, el Cubismo y el arte contemporáneo con sus rasgos principales."
   ],
   [
    "Arte andino y boliviano",
    "Tiwanaku, barroco mestizo y textiles.",
    "Reconoce expresiones del arte andino: la escultura de Tiwanaku, el barroco mestizo y los textiles tradicionales como los aguayos."
   ],
   [
    "Teoría del color y composición",
    "Armonía, contraste y equilibrio.",
    "Usa el círculo cromático (primarios, secundarios, complementarios) y principios de composición como equilibrio, ritmo y jerarquía."
   ]
  ]
 },
 "Salud Pública y Primeros Auxilios": {
  "desc": "Prevención, atención inicial de emergencias y hábitos de salud.",
  "modules": [
   [
    "Salud y prevención",
    "Niveles de prevención y determinantes.",
    "Diferencia promoción de la salud y prevención primaria, secundaria y terciaria, y reconoce los factores que influyen en la salud de una comunidad."
   ],
   [
    "Primeros auxilios",
    "Atención inicial en emergencias.",
    "Aplica la secuencia de evaluación de la escena y de la persona, la posición lateral de seguridad, el control de hemorragias y los pasos básicos de la RCP."
   ],
   [
    "Higiene, nutrición y enfermedades comunes",
    "Hábitos que previenen enfermedades.",
    "Relaciona higiene, alimentación balanceada y vacunación con la prevención de enfermedades infecciosas y crónicas frecuentes."
   ]
  ]
 },
 "Ciencias de la Tierra y Ambiente": {
  "desc": "Suelo, agua, clima y manejo sostenible de los recursos naturales.",
  "modules": [
   [
    "Suelo y agua",
    "Formación del suelo y ciclo del agua.",
    "Describe los horizontes del suelo, su fertilidad y el ciclo del agua, y su importancia para la producción agropecuaria."
   ],
   [
    "Clima y ecosistemas de Bolivia",
    "Pisos ecológicos y clima.",
    "Relaciona los pisos ecológicos de Bolivia (altiplano, valles, yungas y llanos) con su clima y su producción."
   ],
   [
    "Recursos naturales y sostenibilidad",
    "Uso responsable y cambio climático.",
    "Distingue recursos renovables y no renovables, y explica el cambio climático y las prácticas sostenibles de manejo."
   ]
  ]
 }
});

// Materias adicionales por carrera (se suman a las ya definidas arriba)
T['Ciencias Sociales'] = {
 "desc": "Sociedad, cultura, métodos de las ciencias sociales y problemas sociales de Bolivia.",
 "modules": [
  [
   "La sociedad y la cultura",
   "Instituciones, grupos y diversidad cultural.",
   "Distingue sociedad, cultura e instituciones, y reconoce la diversidad cultural y lingüística de Bolivia."
  ],
  [
   "Métodos de las ciencias sociales",
   "Observación, encuesta y análisis.",
   "Diferencia la investigación cualitativa y cuantitativa, y reconoce técnicas como la observación, la entrevista y la encuesta."
  ],
  [
   "Problemas sociales y desarrollo",
   "Pobreza, desigualdad y desarrollo humano.",
   "Analiza causas y consecuencias de la pobreza y la desigualdad, e interpreta indicadores de desarrollo humano."
  ]
 ]
};

// Materias por carrera para las áreas y carreras de la base de datos del proyecto
const BY_CAREER = {
 "Biología": [
  "Biología",
  "Química",
  "Matemáticas",
  "Lenguaje y Comunicación"
 ],
 "Ciencias Químicas / Química": [
  "Química",
  "Matemáticas",
  "Física",
  "Biología"
 ],
 "Física": [
  "Matemáticas",
  "Física",
  "Química",
  "Razonamiento Lógico"
 ],
 "Matemáticas": [
  "Matemáticas",
  "Física",
  "Razonamiento Lógico",
  "Informática y Programación"
 ],
 "Ingeniería Matemática": [
  "Matemáticas",
  "Física",
  "Razonamiento Lógico",
  "Informática y Programación"
 ],
 "Estadística": [
  "Matemáticas",
  "Razonamiento Lógico",
  "Informática y Programación",
  "Economía y Contabilidad Básica"
 ],
 "Ingeniería Geográfica": [
  "Matemáticas",
  "Física",
  "Ciencias de la Tierra y Ambiente",
  "Dibujo y Geometría"
 ],
 "Ingeniería Geológica / Geología": [
  "Matemáticas",
  "Física",
  "Química",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ciencias Ambientales / Ingeniería Ambiental": [
  "Biología",
  "Química",
  "Matemáticas",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ingeniería Socioambiental": [
  "Biología",
  "Ciencias de la Tierra y Ambiente",
  "Ciencias Sociales",
  "Lenguaje y Comunicación"
 ],
 "Ingeniería en Recursos Naturales": [
  "Biología",
  "Química",
  "Matemáticas",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ingeniería en Biotecnología": [
  "Biología",
  "Química",
  "Matemáticas",
  "Física"
 ],
 "Meteorología": [
  "Matemáticas",
  "Física",
  "Ciencias de la Tierra y Ambiente",
  "Informática y Programación"
 ],
 "Astronomía": [
  "Matemáticas",
  "Física",
  "Razonamiento Lógico",
  "Informática y Programación"
 ],
 "Geofísica": [
  "Matemáticas",
  "Física",
  "Ciencias de la Tierra y Ambiente",
  "Informática y Programación"
 ],
 "Cartografía / Sistemas de Información Geográfica": [
  "Matemáticas",
  "Ciencias de la Tierra y Ambiente",
  "Informática y Programación",
  "Dibujo y Geometría"
 ],
 "Ingeniería Civil": [
  "Matemáticas",
  "Física",
  "Química",
  "Razonamiento Lógico",
  "Dibujo y Geometría"
 ],
 "Ingeniería de Sistemas / Informática": [
  "Matemáticas",
  "Física",
  "Razonamiento Lógico",
  "Informática y Programación",
  "Inglés"
 ],
 "Ingeniería Industrial": [
  "Matemáticas",
  "Física",
  "Química",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica"
 ],
 "Arquitectura": [
  "Matemáticas",
  "Dibujo y Geometría",
  "Física",
  "Lenguaje y Comunicación",
  "Historia del Arte y Diseño"
 ],
 "Ingeniería Eléctrica": [
  "Matemáticas",
  "Física",
  "Química",
  "Dibujo y Geometría"
 ],
 "Ingeniería Electrónica": [
  "Matemáticas",
  "Física",
  "Razonamiento Lógico",
  "Informática y Programación"
 ],
 "Ingeniería Mecánica": [
  "Matemáticas",
  "Física",
  "Química",
  "Dibujo y Geometría"
 ],
 "Ingeniería Química": [
  "Matemáticas",
  "Física",
  "Química",
  "Biología"
 ],
 "Ingeniería en Telecomunicaciones": [
  "Matemáticas",
  "Física",
  "Razonamiento Lógico",
  "Informática y Programación",
  "Inglés"
 ],
 "Ingeniería Petrolera / de Petróleo y Gas": [
  "Matemáticas",
  "Física",
  "Química",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ingeniería Agronómica": [
  "Biología",
  "Química",
  "Matemáticas",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Medicina Veterinaria y Zootecnia": [
  "Biología",
  "Química",
  "Matemáticas",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ingeniería Forestal": [
  "Biología",
  "Ciencias de la Tierra y Ambiente",
  "Matemáticas",
  "Química"
 ],
 "Ingeniería Agroindustrial": [
  "Química",
  "Biología",
  "Matemáticas",
  "Economía y Contabilidad Básica"
 ],
 "Ingeniería Agrícola": [
  "Biología",
  "Química",
  "Matemáticas",
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ingeniería en Desarrollo Rural": [
  "Biología",
  "Ciencias de la Tierra y Ambiente",
  "Ciencias Sociales",
  "Matemáticas"
 ],
 "Ingeniería en Agricultura Tropical": [
  "Biología",
  "Química",
  "Ciencias de la Tierra y Ambiente",
  "Matemáticas"
 ],
 "Ingeniería en Recursos Naturales Renovables": [
  "Biología",
  "Ciencias de la Tierra y Ambiente",
  "Química",
  "Matemáticas"
 ],
 "Ingeniería en Gestión Ambiental y Recursos Naturales": [
  "Biología",
  "Ciencias de la Tierra y Ambiente",
  "Química",
  "Lenguaje y Comunicación"
 ],
 "Medicina": [
  "Biología",
  "Química",
  "Física",
  "Lenguaje y Comunicación",
  "Salud Pública y Primeros Auxilios"
 ],
 "Enfermería": [
  "Biología",
  "Química",
  "Lenguaje y Comunicación",
  "Salud Pública y Primeros Auxilios"
 ],
 "Odontología": [
  "Biología",
  "Química",
  "Lenguaje y Comunicación",
  "Salud Pública y Primeros Auxilios"
 ],
 "Bioquímica y Farmacia / Química Farmacéutica": [
  "Química",
  "Biología",
  "Matemáticas",
  "Salud Pública y Primeros Auxilios"
 ],
 "Psicología": [
  "Biología",
  "Lenguaje y Comunicación",
  "Razonamiento Lógico",
  "Filosofía y Ética"
 ],
 "Nutrición y Dietética": [
  "Biología",
  "Química",
  "Matemáticas",
  "Salud Pública y Primeros Auxilios"
 ],
 "Fisioterapia y Kinesiología": [
  "Biología",
  "Física",
  "Química",
  "Salud Pública y Primeros Auxilios"
 ],
 "Tecnología Médica / Laboratorio Clínico": [
  "Biología",
  "Química",
  "Matemáticas",
  "Salud Pública y Primeros Auxilios"
 ],
 "Enfermería Obstetriz": [
  "Biología",
  "Química",
  "Lenguaje y Comunicación",
  "Salud Pública y Primeros Auxilios"
 ],
 "Salud Pública / Gestión en Salud": [
  "Biología",
  "Lenguaje y Comunicación",
  "Razonamiento Lógico",
  "Salud Pública y Primeros Auxilios"
 ],
 "Derecho / Ciencias Jurídicas": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Razonamiento Lógico",
  "Educación Cívica y Derechos",
  "Filosofía y Ética"
 ],
 "Trabajo Social": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Ciencias Sociales",
  "Educación Cívica y Derechos"
 ],
 "Ciencias de la Educación": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Razonamiento Lógico",
  "Filosofía y Ética"
 ],
 "Comunicación Social": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Razonamiento Lógico",
  "Inglés",
  "Educación Cívica y Derechos"
 ],
 "Turismo": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Inglés",
  "Ciencias Sociales"
 ],
 "Ciencia Política": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Razonamiento Lógico",
  "Educación Cívica y Derechos"
 ],
 "Sociología": [
  "Lenguaje y Comunicación",
  "Historia y Geografía de Bolivia",
  "Ciencias Sociales",
  "Filosofía y Ética"
 ],
 "Lingüística e Idiomas": [
  "Lenguaje y Comunicación",
  "Inglés",
  "Historia y Geografía de Bolivia",
  "Filosofía y Ética"
 ],
 "Artes Plásticas / Diseño Gráfico": [
  "Dibujo y Geometría",
  "Historia del Arte y Diseño",
  "Lenguaje y Comunicación",
  "Informática y Programación"
 ],
 "Contaduría Pública": [
  "Matemáticas",
  "Lenguaje y Comunicación",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica"
 ],
 "Economía": [
  "Matemáticas",
  "Historia y Geografía de Bolivia",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica"
 ],
 "Ingeniería Comercial": [
  "Matemáticas",
  "Lenguaje y Comunicación",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica",
  "Inglés"
 ],
 "Ingeniería Financiera / Finanzas": [
  "Matemáticas",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica",
  "Inglés"
 ],
 "Auditoría": [
  "Matemáticas",
  "Lenguaje y Comunicación",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica"
 ],
 "Marketing": [
  "Lenguaje y Comunicación",
  "Razonamiento Lógico",
  "Economía y Contabilidad Básica",
  "Ciencias Sociales"
 ],
 "Comercio Internacional": [
  "Matemáticas",
  "Inglés",
  "Economía y Contabilidad Básica",
  "Historia y Geografía de Bolivia"
 ],
 "Gestión Pública": [
  "Lenguaje y Comunicación",
  "Educación Cívica y Derechos",
  "Economía y Contabilidad Básica",
  "Razonamiento Lógico"
 ],
 "Planificación y Desarrollo": [
  "Matemáticas",
  "Historia y Geografía de Bolivia",
  "Economía y Contabilidad Básica",
  "Ciencias Sociales"
 ]
};

const EXTRA = {
 "Ingeniería Civil": [
  "Dibujo y Geometría"
 ],
 "Ingeniería de Sistemas": [
  "Informática y Programación",
  "Inglés"
 ],
 "Ingeniería Industrial": [
  "Economía y Contabilidad Básica"
 ],
 "Ingeniería Eléctrica": [
  "Dibujo y Geometría"
 ],
 "Ingeniería Química": [
  "Ciencias de la Tierra y Ambiente"
 ],
 "Medicina": [
  "Salud Pública y Primeros Auxilios"
 ],
 "Odontología": [
  "Salud Pública y Primeros Auxilios"
 ],
 "Enfermería": [
  "Salud Pública y Primeros Auxilios"
 ],
 "Bioquímica y Farmacia": [
  "Salud Pública y Primeros Auxilios"
 ],
 "Administración de Empresas": [
  "Economía y Contabilidad Básica"
 ],
 "Contaduría Pública": [
  "Economía y Contabilidad Básica"
 ],
 "Economía": [
  "Economía y Contabilidad Básica"
 ],
 "Ingeniería Comercial": [
  "Economía y Contabilidad Básica",
  "Inglés"
 ],
 "Derecho": [
  "Educación Cívica y Derechos",
  "Filosofía y Ética"
 ],
 "Ciencias Políticas": [
  "Educación Cívica y Derechos"
 ],
 "Arquitectura": [
  "Historia del Arte y Diseño"
 ],
 "Diseño Gráfico": [
  "Historia del Arte y Diseño",
  "Informática y Programación"
 ],
 "Psicología": [
  "Filosofía y Ética"
 ],
 "Ciencias de la Educación": [
  "Filosofía y Ética"
 ],
 "Comunicación Social": [
  "Inglés",
  "Educación Cívica y Derechos"
 ],
 "Ingeniería Agronómica": [
  "Ciencias de la Tierra y Ambiente"
 ],
 "Medicina Veterinaria y Zootecnia": [
  "Ciencias de la Tierra y Ambiente"
 ],
 "Ingeniería en Industria de Alimentos": [
  "Ciencias de la Tierra y Ambiente"
 ]
};
FACULTIES.forEach(f => f.careers.forEach(c => (EXTRA[c[0]] || []).forEach(s => c[2].push(s))));

module.exports = function seed(db, hashPassword) {
  const insUser = db.prepare('INSERT INTO usuarios (name, email, password_hash, role, phone, department, university_id) VALUES (?,?,?,?,?,?,?)');
  insUser.run('Administrador General', 'admin@kallpa.bo', hashPassword('Admin2026!'), 'admin', '', '', null);
  insUser.run('Profesor de Ejemplo', 'profesor@kallpa.bo', hashPassword('Profesor2026!'), 'teacher', '', '', null);
  insUser.run('Estudiante de Ejemplo', 'estudiante@kallpa.bo', hashPassword('Estudiante2026!'), 'student', '', 'cochabamba', (db.prepare("SELECT id FROM universidades WHERE short = 'UMSS'").get() || {}).id || null);

  const insF = db.prepare('INSERT INTO areas_academicas (name, description, departments, university_ids, position) VALUES (?,?,?,?,?)');
  const insC = db.prepare('INSERT INTO carreras (faculty_id, name, description, position) VALUES (?,?,?,?)');
  const insS = db.prepare('INSERT INTO materias (career_id, name, description, position) VALUES (?,?,?,?)');
  const insM = db.prepare('INSERT INTO modulos (subject_id, title, summary, content, position) VALUES (?,?,?,?,?)');

  const insE = db.prepare('INSERT INTO eventos (title, date, time, place, description, department, kind) VALUES (?,?,?,?,?,?,?)');
  insE.run('Examen de admisión · Primera convocatoria', '2026-12-12', '08:00', 'Campus universitario', 'Presenta tu cédula de identidad y el comprobante de inscripción.', 'cochabamba', 'examen');
  insE.run('Examen de admisión · Primera convocatoria', '2026-12-14', '08:30', 'Ciudad universitaria', 'Llega 30 minutos antes. Lleva lápiz, borrador y tu cédula.', 'la-paz', 'examen');
  insE.run('Cierre de inscripciones', '2026-12-05', '', 'En línea', 'Último día para inscribirte al examen de ingreso.', '', 'inscripcion');
  insE.run('Nuevos módulos de Matemáticas disponibles', '2026-11-30', '', 'Kallpa', 'Ya puedes estudiar los nuevos módulos de Álgebra y Geometría.', '', 'anuncio');

  db.exec('BEGIN');
  try {
    FACULTIES.forEach((f, fi) => {
      const fid = Number(insF.run(f.name, f.description, f.departments || 'la-paz,cochabamba', db.prepare("SELECT group_concat(id) AS ids FROM universidades WHERE ',' || ? || ',' LIKE '%,' || department || ',%'").get(f.departments || 'la-paz,cochabamba').ids || '', fi + 1).lastInsertRowid);
      f.careers.forEach(([cname, cdesc, subjects], ci) => {
        const cid = Number(insC.run(fid, cname, cdesc, ci + 1).lastInsertRowid);
        subjects.forEach((sname, si) => {
          const t = T[sname];
          const sid = Number(insS.run(cid, sname, t.desc, si + 1).lastInsertRowid);
          t.modules.forEach(([title, summary, content], mi) => insM.run(sid, title, summary, content, mi + 1));
        });
      });
    });
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
};

// Información de admisión genérica por carrera y universidad (sin cifras: el admin debe completarla con datos oficiales)
module.exports.fillAdmissions = function fillAdmissions(db) {
  const unis = new Map(db.prepare('SELECT id, short FROM universidades').all().map(u => [u.id, u]));
  const ins = db.prepare('INSERT OR IGNORE INTO requisitos_ingreso (career_id, university_id, requirements, modes, costs, documents, dates) VALUES (?,?,?,?,?,?,?)');
  for (const c of db.prepare('SELECT c.id, f.university_ids FROM carreras c JOIN areas_academicas f ON f.id = c.faculty_id').all()) {
    for (const uid of String(c.university_ids).split(',').filter(Boolean).map(Number)) {
      const u = unis.get(uid); if (!u) continue;
      ins.run(c.id, uid, ...module.exports.genericAdmission(u.short));
    }
  }
};

module.exports.genericAdmission = short => [
  `Ser bachiller o estar por concluir el último año de secundaria.\nCédula de identidad vigente.\nInscribirte al proceso de admisión de ${short} dentro de los plazos de la convocatoria.`,
  'Examen de admisión.\nCurso preuniversitario (según convocatoria).\nPrueba de suficiencia académica (según convocatoria).',
  `Por confirmar. Consulta la convocatoria oficial de ${short}.`,
  'Título de bachiller o certificado de egreso (original y fotocopia).\nFotocopia de la cédula de identidad.\nFotografías 4x4 con fondo claro.\nComprobante de pago de la inscripción.',
  `Revisa el Calendario de Kallpa y la convocatoria oficial de ${short}.`];

// Agrega a bases ya existentes las materias que falten en cada carrera (por nombre de carrera); no duplica ni toca lo demás
module.exports.addMissingSubjects = function addMissingSubjects(db) {
  const getC = db.prepare('SELECT id FROM carreras WHERE name = ?');
  const has = db.prepare('SELECT 1 AS x FROM materias WHERE career_id = ? AND name = ?');
  const last = db.prepare('SELECT COALESCE(MAX(position), 0) AS p FROM materias WHERE career_id = ?');
  const insS = db.prepare('INSERT INTO materias (career_id, name, description, position) VALUES (?,?,?,?)');
  const insM = db.prepare('INSERT INTO modulos (subject_id, title, summary, content, position) VALUES (?,?,?,?,?)');
  db.exec('BEGIN');
  try {
    const plan = new Map(Object.entries(BY_CAREER));
    FACULTIES.forEach(f => f.careers.forEach(([cname, , subjects]) => plan.set(cname, [...new Set([...(plan.get(cname) || []), ...subjects])])));
    plan.forEach((subjects, cname) => getC.all(cname).forEach(c => subjects.forEach(sname => {
      if (has.get(c.id, sname) || !T[sname]) return;
      const sid = Number(insS.run(c.id, sname, T[sname].desc, last.get(c.id).p + 1).lastInsertRowid);
      T[sname].modules.forEach(([t, sm, ct], i) => insM.run(sid, t, sm, ct, i + 1));
    })));
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
};
