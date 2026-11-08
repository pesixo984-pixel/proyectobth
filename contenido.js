'use strict';
// Desarrolla los módulos del plan: lección base por tema + guía del temario + bibliografía de la carrera + video de apoyo.
// Solo reemplaza módulos que aún tienen el texto provisional (no pisa lo que un profesor ya escribió) y agrega preguntas de práctica.
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const L = (re, tema, x, v, q) => ({ re: new RegExp('(?:^|[^a-z])(?:' + re + ')'), tema, x, v, q });

// q = [pregunta, [opciones], índice correcto, explicación]
const LECCIONES = [
L('regla de tres|porcentaje|razones|proporcion|aritmetic|descuento|conversion de unidades', 'Aritmética comercial: razones, proporciones y porcentajes',
`• Razón: cociente a/b. Proporción: igualdad de dos razones, a/b = c/d, y se cumple a·d = b·c.
• Regla de tres simple directa: si 3 cuadernos cuestan 12 Bs, 5 cuestan x = 5·12/3 = 20 Bs. En la inversa se multiplica en línea (más obreros, menos días).
• Regla de tres compuesta: se compara cada magnitud con la incógnita (directa o inversa) y se multiplican las razones.
• Porcentaje: P = (tanto por ciento · cantidad)/100. Descuento sucesivo del 20 % y 10 %: queda 0,8·0,9 = 72 % del precio.
Ejemplo: un artículo de 250 Bs con 12 % de descuento cuesta 250·0,88 = 220 Bs.`,
'regla de tres simple y compuesta porcentajes', ['Si 4 obreros terminan una obra en 15 días, ¿cuántos días tardan 6 obreros?', ['10', '22,5', '9', '12'], 0, 'Es inversa: 4·15 = 6·x, luego x = 10 días.']),
L('interes|anualidad|progresion|valor presente|amortizacion|tasa nominal', 'Matemática financiera e interés',
`• Interés simple: I = C·i·t; monto M = C(1 + i·t).
• Interés compuesto: M = C(1 + i)^n, con i la tasa por período y n el número de períodos. Tasa efectiva = (1 + j/m)^m − 1 para una tasa nominal j capitalizada m veces al año.
• Valor presente: C = M/(1 + i)^n.
• Progresión aritmética: a_n = a_1 + (n−1)d; suma S = n(a_1 + a_n)/2. Geométrica: a_n = a_1·r^(n−1); S = a_1(r^n − 1)/(r − 1).
• Una anualidad es una serie de pagos iguales: su valor es la suma de una progresión geométrica.
Ejemplo: 1000 Bs al 10 % anual compuesto durante 2 años = 1000·1,1² = 1210 Bs.`,
'interés simple y compuesto matemática financiera', ['¿Cuál es el monto de 1000 Bs al 10 % anual compuesto en 2 años?', ['1200', '1210', '1100', '1331'], 1, 'M = 1000·(1,10)² = 1210.']),
L('algebra(?! de boole)|polinom|factoriz|productos notables|teorema del residuo|expresiones', 'Álgebra: polinomios, productos notables y factorización',
`• Productos notables: (a ± b)² = a² ± 2ab + b²; (a + b)(a − b) = a² − b²; (a + b)³ = a³ + 3a²b + 3ab² + b³.
• Factorización: factor común, diferencia de cuadrados, trinomio cuadrado perfecto, trinomio x² + bx + c = (x + m)(x + n) con m + n = b y m·n = c, suma/diferencia de cubos.
• Teorema del residuo: el resto de dividir P(x) entre (x − a) es P(a). Teorema del factor: si P(a) = 0, entonces (x − a) es factor.
• Regla de Ruffini para dividir entre (x − a).
Ejemplo: x² − 5x + 6 = (x − 2)(x − 3).`,
'factorización productos notables álgebra', ['Factorizar x² − 9:', ['(x − 3)²', '(x + 3)(x − 3)', '(x − 9)(x + 1)', 'x(x − 9)'], 1, 'Diferencia de cuadrados: a² − b² = (a + b)(a − b).']),
L('ecuacion|inecuacion|sistema de ecuaciones|sistemas de ecuaciones|desigualdad', 'Ecuaciones, inecuaciones y sistemas',
`• Ecuación lineal ax + b = 0 → x = −b/a. Cuadrática ax² + bx + c = 0 → x = (−b ± √(b² − 4ac))/(2a); el discriminante Δ = b² − 4ac indica 2, 1 o ninguna raíz real.
• Sistemas 2×2: sustitución, igualación, reducción o Cramer. Con 3 incógnitas se reduce a uno de 2×2.
• Inecuaciones: al multiplicar o dividir por un número negativo se invierte el sentido. La solución se escribe como intervalo.
• Planteo: definir la incógnita, traducir el enunciado a una ecuación, resolver y verificar.
Ejemplo: x + y = 7 y x − y = 1 → x = 4, y = 3.`,
'ecuaciones y sistemas de ecuaciones lineales', ['Raíces de x² − 5x + 6 = 0:', ['1 y 6', '2 y 3', '−2 y −3', '5 y 6'], 1, 'Suman 5 y su producto es 6.']),
L('funcion(?:es)?(?![a-z])(?! del lenguaje)|logaritm|exponencial', 'Funciones: lineal, cuadrática, exponencial y logarítmica',
`• Función: a cada x le corresponde un único y. Dominio: valores permitidos de x; rango: valores que toma y.
• Lineal y = mx + b (pendiente m, ordenada b). Cuadrática y = ax² + bx + c: parábola con vértice en x = −b/(2a).
• Exponencial y = a^x (a > 0, a ≠ 1) modela crecimiento, por ejemplo bacterias o capital. Logarítmica: log_a x = y ⇔ a^y = x.
• Propiedades: log(AB) = log A + log B; log(A/B) = log A − log B; log(A^n) = n·log A.
Ejemplo: log₂ 8 = 3 porque 2³ = 8.`,
'funciones exponencial logaritmo', ['log₂ 32 =', ['4', '5', '16', '6'], 1, '2⁵ = 32.']),
L('trigonometr', 'Trigonometría',
`• En un triángulo rectángulo: sen θ = cateto opuesto/hipotenusa; cos θ = cateto adyacente/hipotenusa; tan θ = opuesto/adyacente.
• Identidad fundamental: sen²θ + cos²θ = 1; tan θ = sen θ/cos θ.
• Valores notables: sen 30° = 1/2, sen 45° = √2/2, sen 60° = √3/2; cos en orden inverso.
• Ley de senos: a/sen A = b/sen B = c/sen C. Ley de cosenos: c² = a² + b² − 2ab·cos C.
• Radianes: 180° = π rad.
Ejemplo: en un triángulo con hipotenusa 10 y ángulo de 30°, el cateto opuesto mide 5.`,
'trigonometría razones trigonométricas', ['sen²θ + cos²θ =', ['0', '1', 'tan θ', '2'], 1, 'Es la identidad pitagórica.']),
L('geometria analitica|recta|circunferencia|parabola|elipse|hiperbola|conicas', 'Geometría analítica',
`• Distancia entre puntos: d = √((x₂ − x₁)² + (y₂ − y₁)²). Punto medio: ((x₁ + x₂)/2, (y₁ + y₂)/2).
• Recta: pendiente m = (y₂ − y₁)/(x₂ − x₁); y − y₁ = m(x − x₁). Paralelas: m₁ = m₂; perpendiculares: m₁·m₂ = −1.
• Circunferencia de centro (h, k) y radio r: (x − h)² + (y − k)² = r².
• Parábola: (x − h)² = 4p(y − k). Elipse: x²/a² + y²/b² = 1. Hipérbola: x²/a² − y²/b² = 1.
Ejemplo: la distancia entre (1, 2) y (4, 6) es 5.`,
'geometría analítica recta circunferencia cónicas', ['Pendiente de la recta que pasa por (1, 2) y (3, 6):', ['1', '2', '3', '4'], 1, 'm = (6 − 2)/(3 − 1) = 2.']),
L('geometria plana|geometria del espacio|areas|volumen|perimetro|simetria|escala', 'Geometría plana y del espacio',
`• Áreas: triángulo b·h/2; rectángulo b·h; círculo πr²; trapecio (B + b)h/2; rombo D·d/2.
• Perímetro del círculo 2πr. Teorema de Pitágoras: a² + b² = c².
• Volúmenes: cubo a³; prisma A_base·h; cilindro πr²h; cono πr²h/3; esfera 4πr³/3.
• Semejanza: figuras con ángulos iguales y lados proporcionales; la razón de áreas es el cuadrado de la razón de lados.
Ejemplo: un cilindro de r = 3 y h = 10 tiene V = 90π.`,
'geometría plana áreas y volúmenes', ['Área de un círculo de radio 5:', ['10π', '25π', '5π', '50π'], 1, 'A = πr² = 25π.']),
L('limite|derivad|calculo|integra|continuidad|optim', 'Cálculo: límites y derivadas',
`• Límite: lim x→a f(x) = L si f se acerca a L cuando x se acerca a a. Si resulta 0/0, se factoriza y simplifica.
• Derivada: f′(x) = lim h→0 [f(x + h) − f(x)]/h; representa la pendiente de la recta tangente.
• Reglas: (xⁿ)′ = n·xⁿ⁻¹; (u·v)′ = u′v + uv′; (u/v)′ = (u′v − uv′)/v²; regla de la cadena: [f(g(x))]′ = f′(g(x))·g′(x).
• Optimización: se deriva, se iguala a cero y se analiza el signo para hallar máximos y mínimos.
• La integral es el proceso inverso: ∫xⁿ dx = xⁿ⁺¹/(n + 1) + C.
Ejemplo: d/dx (3x⁴ − 2x) = 12x³ − 2.`,
'límites y derivadas cálculo', ['Derivada de f(x) = x³:', ['x²', '3x²', '3x', 'x³/3'], 1, 'Regla de la potencia: n·xⁿ⁻¹.']),
L('matrice|determinante|algebra lineal|cramer', 'Matrices y determinantes',
`• Matriz m×n: arreglo de m filas y n columnas. Suma: elemento a elemento. Producto A·B: requiere columnas de A = filas de B y, en general, A·B ≠ B·A.
• Determinante 2×2: |a b; c d| = ad − bc. Una matriz es invertible si su determinante es distinto de cero.
• Regla de Cramer: x_i = det(A_i)/det(A).
• Los sistemas lineales se resuelven también por eliminación de Gauss.
Ejemplo: |2 3; 1 4| = 2·4 − 3·1 = 5.`,
'matrices y determinantes', ['Determinante de [[2, 3], [1, 4]]:', ['5', '11', '8', '−5'], 0, 'ad − bc = 8 − 3 = 5.']),
L('vector', 'Vectores',
`• Un vector tiene módulo, dirección y sentido. Componentes: A = (Aₓ, A_y) con Aₓ = A·cos θ y A_y = A·sen θ.
• Módulo: |A| = √(Aₓ² + A_y²). Suma: componente a componente (método del paralelogramo o del polígono).
• Producto escalar: A·B = |A||B|cos θ = AₓBₓ + A_yB_y (resultado numérico; es 0 si son perpendiculares).
• Producto vectorial: |A×B| = |A||B|sen θ (resultado vectorial perpendicular a ambos).
Ejemplo: (3, 4) tiene módulo 5.`,
'vectores suma componentes física', ['Módulo del vector (3, 4):', ['7', '5', '25', '12'], 1, '√(9 + 16) = 5.']),
L('cinematic|mru|mruv|movimiento|caida libre|magnitud', 'Cinemática: MRU, MRUV y MCU',
`• MRU (velocidad constante): x = x₀ + v·t.
• MRUV (aceleración constante): v = v₀ + a·t; x = x₀ + v₀t + ½at²; v² = v₀² + 2a·Δx.
• Caída libre: MRUV con a = g ≈ 9,8 m/s² hacia abajo.
• MCU: período T, frecuencia f = 1/T, velocidad angular ω = 2π/T, velocidad lineal v = ω·r, aceleración centrípeta a = v²/r.
Ejemplo: un auto parte del reposo con a = 2 m/s²; en 5 s recorre ½·2·25 = 25 m.`,
'cinemática MRU MRUV física', ['Un cuerpo parte del reposo con a = 2 m/s². ¿Qué distancia recorre en 5 s?', ['10 m', '25 m', '50 m', '20 m'], 1, 'x = ½at² = ½·2·25 = 25 m.']),
L('newton|dinamica|estatica|fuerza|diagrama de cuerpo libre|rozamiento|momento lineal', 'Leyes de Newton, dinámica y estática',
`• 1.ª ley (inercia): sin fuerza neta, el cuerpo mantiene su estado de reposo o de MRU.
• 2.ª ley: ΣF = m·a. 3.ª ley: acción y reacción, de igual módulo y sentido contrario, sobre cuerpos distintos.
• Peso: W = m·g. Rozamiento: f = μ·N.
• Diagrama de cuerpo libre: se aíslan el cuerpo y todas las fuerzas sobre él, y se aplica ΣFₓ = m·aₓ, ΣF_y = m·a_y.
• Estática: equilibrio si ΣF = 0 y ΣM = 0 (momento M = F·d).
• Momento lineal p = m·v; se conserva si no hay fuerzas externas.
Ejemplo: F = 20 N sobre 4 kg sin rozamiento produce a = 5 m/s².`,
'leyes de Newton dinámica física', ['Una fuerza neta de 20 N actúa sobre 4 kg. ¿Cuál es la aceleración?', ['5 m/s²', '80 m/s²', '0,2 m/s²', '16 m/s²'], 0, 'a = F/m = 20/4.']),
L('trabajo|energia|potencia|conservacion', 'Trabajo, energía y potencia',
`• Trabajo: W = F·d·cos θ (joule). Potencia: P = W/t (watt).
• Energía cinética: Ec = ½mv². Potencial gravitatoria: Ep = m·g·h.
• Teorema trabajo-energía: W_neto = ΔEc.
• Conservación de la energía mecánica (sin rozamiento): Ec + Ep = constante.
Ejemplo: una piedra de 2 kg cae desde 5 m; llega con v = √(2gh) ≈ 9,9 m/s.`,
'trabajo energía y potencia física', ['La unidad de potencia en el SI es:', ['joule', 'newton', 'watt', 'pascal'], 2, 'P = W/t se mide en watts (J/s).']),
L('termodinamic|calor|calorimetr|temperatura|termometric', 'Calor y termodinámica',
`• Escalas: K = °C + 273,15; °F = 1,8·°C + 32.
• Calor sensible: Q = m·c·ΔT. Calor latente: Q = m·L en un cambio de fase. En una mezcla aislada, Q ganado = Q perdido.
• Ley cero: dos cuerpos en equilibrio con un tercero están en equilibrio entre sí.
• Primera ley: ΔU = Q − W (conservación de la energía). Segunda ley: el calor fluye espontáneamente del cuerpo caliente al frío y ninguna máquina térmica es 100 % eficiente.
Ejemplo: calentar 1 kg de agua (c = 4,18 kJ/kg·K) 10 °C requiere 41,8 kJ.`,
'calorimetría y termodinámica', ['0 °C equivale a:', ['0 K', '100 K', '273,15 K', '32 K'], 2, 'K = °C + 273,15.']),
L('hidrostatic|fluido|presion|pascal|arquimedes|bernou|densidad|viscosidad', 'Hidrostática y fluidos',
`• Densidad ρ = m/V. Presión P = F/A.
• Presión hidrostática: P = P₀ + ρ·g·h.
• Principio de Pascal: la presión aplicada a un fluido se transmite íntegra; prensa hidráulica F₁/A₁ = F₂/A₂.
• Arquímedes: el empuje es E = ρ_fluido·g·V_sumergido; el cuerpo flota si su densidad es menor.
• Continuidad: A₁v₁ = A₂v₂. Bernoulli: P + ½ρv² + ρgh = constante.
Ejemplo: a 10 m de profundidad en agua, ρgh ≈ 98 kPa sobre la presión atmosférica.`,
'hidrostática principio de Arquímedes Pascal', ['La presión hidrostática depende de:', ['la forma del recipiente', 'la profundidad y la densidad', 'el color del líquido', 'solo del volumen'], 1, 'P = ρ·g·h.']),
L('electric|electrostatic|ohm|kirchhoff|circuito|coulomb|magnet|inductancia|capacitancia|electromagnet', 'Electricidad y circuitos',
`• Ley de Coulomb: F = k·q₁q₂/r², con k ≈ 9×10⁹ N·m²/C².
• Corriente I = Q/t (amperio). Ley de Ohm: V = I·R. Potencia P = V·I = I²R.
• Resistencias en serie: R = R₁ + R₂ + … (misma corriente). En paralelo: 1/R = 1/R₁ + 1/R₂ + … (mismo voltaje).
• Kirchhoff: en un nodo ΣI entrantes = ΣI salientes; en una malla ΣV = 0.
• Una carga en movimiento genera campo magnético; las variaciones del flujo magnético inducen voltaje (Faraday).
Ejemplo: 12 V sobre 4 Ω produce 3 A.`,
'ley de Ohm circuitos eléctricos', ['Si V = 12 V y R = 4 Ω, la corriente es:', ['3 A', '48 A', '0,33 A', '8 A'], 0, 'I = V/R = 3 A.']),
L('onda|optica|sonido|espectro|reflexion|refraccion|ondulatorio|acustic', 'Ondas y óptica',
`• Onda: v = λ·f. Las mecánicas necesitan un medio (sonido); las electromagnéticas se propagan en el vacío a c = 3×10⁸ m/s.
• Espectro electromagnético, de menor a mayor frecuencia: radio, microondas, infrarrojo, visible, ultravioleta, rayos X y gamma.
• Reflexión: ángulo de incidencia = ángulo de reflexión. Refracción (Snell): n₁·sen θ₁ = n₂·sen θ₂.
• Lentes y espejos: 1/f = 1/d_o + 1/d_i.
Ejemplo: una onda de 340 m/s y 170 Hz tiene λ = 2 m.`,
'ondas y óptica física', ['La relación entre velocidad, longitud de onda y frecuencia es:', ['v = λ/f', 'v = λ·f', 'v = f/λ', 'v = λ + f'], 1, 'v = λ·f.']),
L('atomic|tabla periodica|enlace|configuracion electronica|geometria molecular|periodic', 'Estructura atómica, tabla periódica y enlace',
`• Átomo: protones (Z, número atómico), neutrones y electrones; A = protones + neutrones. Los isótopos tienen igual Z y distinto A.
• Configuración electrónica: orden de llenado 1s, 2s, 2p, 3s, 3p, 4s, 3d… (máx. 2, 6, 10, 14 electrones por subnivel).
• Tabla periódica: los grupos tienen igual número de electrones de valencia. Aumentan hacia la derecha la electronegatividad y la energía de ionización.
• Enlace iónico: transferencia de electrones (metal + no metal). Covalente: compartición. Metálico: mar de electrones.
• Regla del octeto y geometría molecular (VSEPR): H₂O es angular; CO₂ lineal; CH₄ tetraédrica.`,
'estructura atómica tabla periódica enlace químico', ['El enlace entre Na y Cl es:', ['covalente', 'iónico', 'metálico', 'de hidrógeno'], 1, 'Un metal transfiere un electrón a un no metal.']),
L('nomenclatura inorganica|nomenclatura|formulacion|leyes ponderales|balanceo|redox', 'Nomenclatura y balanceo',
`• Óxido básico = metal + O (Na₂O). Óxido ácido = no metal + O (CO₂). Hidróxido = óxido básico + H₂O (NaOH). Ácido oxácido = óxido ácido + H₂O (H₂SO₄). Sal = ácido + base.
• Tradicional: prefijos hipo-/per- y sufijos -oso/-ico. Stock: número romano de la valencia (óxido de hierro (III)). IUPAC: prefijos mono-, di-, tri-.
• Leyes ponderales: Lavoisier (conservación de la masa), Proust (proporciones definidas), Dalton (múltiples), Richter (recíprocas).
• Balanceo por tanteo o por redox (ion-electrón): se igualan los electrones ganados y perdidos.
Ejemplo: 2H₂ + O₂ → 2H₂O.`,
'nomenclatura química inorgánica balanceo', ['La fórmula del ácido sulfúrico es:', ['HCl', 'H₂SO₄', 'HNO₃', 'NaOH'], 1, 'Es el oxácido del azufre (VI).']),
L('estequiometr|solucion|concentracion|molaridad|ph\\b|acidez|acido|equilibrio quimico|propiedades coligativas|reactivo limite', 'Estequiometría, soluciones y pH',
`• Mol: 6,02×10²³ entidades; masa molar en g/mol. n = m/M.
• Estequiometría: los coeficientes de la ecuación balanceada dan la relación molar. Reactivo limitante: el que se agota primero. Rendimiento = real/teórico × 100 %.
• Molaridad M = n/V (L); molalidad m = n/kg de solvente; dilución C₁V₁ = C₂V₂.
• pH = −log[H⁺]; pH < 7 ácido, = 7 neutro, > 7 básico; pH + pOH = 14.
Ejemplo: HCl 0,01 M tiene pH = 2.`,
'estequiometría soluciones y pH', ['El pH de una solución 0,001 M de HCl es:', ['1', '2', '3', '11'], 2, 'pH = −log(10⁻³) = 3.']),
L('gases', 'Leyes de los gases',
`• Boyle (T constante): P₁V₁ = P₂V₂. Charles (P constante): V₁/T₁ = V₂/T₂. Gay-Lussac (V constante): P₁/T₁ = P₂/T₂. La temperatura va siempre en kelvin.
• Gas ideal: PV = nRT, con R = 0,082 atm·L/(mol·K).
• Condiciones normales: 1 mol ocupa 22,4 L a 0 °C y 1 atm.
• Dalton: la presión total es la suma de las presiones parciales.
Ejemplo: 2 mol a 300 K y 24,6 L ejercen P = 2·0,082·300/24,6 = 2 atm.`,
'leyes de los gases ideales', ['Un gas se comprime a temperatura constante hasta la mitad del volumen; su presión:', ['se reduce a la mitad', 'se duplica', 'no cambia', 'se cuadruplica'], 1, 'Boyle: P·V = constante.']),
L('organica|hibridacion|hidrocarburo|grupos funcionales|isomeria|alcohol|aldehido|cetona|carboxilic|biomolecula', 'Química orgánica y grupos funcionales',
`• El carbono forma 4 enlaces: sp³ (tetraédrico, alcanos), sp² (plano, alquenos), sp (lineal, alquinos).
• Hidrocarburos: alcanos CₙH₂ₙ₊₂ (met-, et-, prop-, but-, pent-, hex-…), alquenos CₙH₂ₙ, alquinos CₙH₂ₙ₋₂.
• Grupos funcionales: alcohol −OH; aldehído −CHO; cetona C=O; ácido carboxílico −COOH; éter −O−; éster −COO−; amina −NH₂.
• Nomenclatura IUPAC: cadena principal más larga, numeración que dé el menor localizador al grupo principal, sustituyentes en orden alfabético.
• Isomería: estructural (distinta conectividad) y estereoisomería (distinta disposición espacial).
• Reacciones: adición (en dobles enlaces), sustitución y eliminación.`,
'química orgánica grupos funcionales', ['El grupo funcional −COOH corresponde a:', ['alcohol', 'ácido carboxílico', 'aldehído', 'amina'], 1, 'Es el grupo carboxilo.']),
L('celula|celular|organelo|membrana|procarionte|eucarionte|difusion|osmosis|microbiolog|bacteria|virus|hongo', 'La célula y la membrana celular',
`• Teoría celular: todo ser vivo está formado por células, la célula es la unidad básica y proviene de otra célula.
• Procariota: sin núcleo definido (bacterias). Eucariota: con núcleo y organelos (animales, plantas, hongos, protistas).
• Organelos: núcleo (ADN), mitocondria (respiración, ATP), ribosoma (síntesis de proteínas), retículo endoplasmático, aparato de Golgi (empaque), lisosomas; cloroplastos y pared celular en vegetales.
• Membrana: bicapa de fosfolípidos. Transporte pasivo (difusión, ósmosis, a favor del gradiente) y activo (gasta ATP, en contra del gradiente).`,
'célula procariota eucariota organelos biología', ['¿Qué organelo produce la mayor parte del ATP?', ['Ribosoma', 'Mitocondria', 'Lisosoma', 'Golgi'], 1, 'En la respiración celular.']),
L('ciclo celular|mitosis|meiosis|adn|arn|replicacion|transcripcion|traduccion|genetic|mendel|mutacion|cancer', 'Ciclo celular, ADN y genética',
`• Ciclo celular: interfase (G1, S, G2) y división. Mitosis: profase, metafase, anafase y telofase → 2 células idénticas (2n). Meiosis: 2 divisiones → 4 gametos (n).
• ADN: doble hélice de nucleótidos, con A–T y C–G. Replicación semiconservativa. Transcripción: ADN → ARNm. Traducción: ARNm → proteína en el ribosoma (cada codón de 3 bases = 1 aminoácido).
• Mendel: genes dominantes y recesivos. Cruce Aa × Aa → 25 % AA, 50 % Aa, 25 % aa (fenotipo 3:1).
• Mutación: cambio en la secuencia de ADN; el cáncer es una división celular sin control por mutaciones acumuladas.`,
'ciclo celular mitosis meiosis ADN genética', ['Un cruce Aa × Aa produce fenotipos dominante:recesivo en proporción:', ['1:1', '3:1', '1:3', '9:3'], 1, 'El 75 % muestra el carácter dominante.']),
L('fotosintesis|botanic|raiz|tallo|vegetal|histologia vegetal|fisiologia vegetal|taxonomi|reino|zoolog|invertebrado|vertebrado|dendrolog', 'Botánica, fotosíntesis y clasificación de los seres vivos',
`• Fotosíntesis: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂. Fase luminosa (tilacoides: produce ATP, NADPH y O₂) y fase oscura o ciclo de Calvin (estroma: fija CO₂).
• Órganos vegetales: raíz (absorción), tallo (sostén, conducción por xilema y floema), hoja (fotosíntesis), flor y fruto (reproducción).
• Respiración y transpiración: intercambio de gases por los estomas.
• Taxonomía: dominio, reino, filo, clase, orden, familia, género y especie (nomenclatura binomial). Dominios: Bacteria, Archaea y Eukarya.
• Vertebrados: peces, anfibios, reptiles, aves y mamíferos; invertebrados: la gran mayoría de los animales.`,
'fotosíntesis botánica biología', ['La fase oscura de la fotosíntesis ocurre en:', ['el estroma', 'la mitocondria', 'el núcleo', 'la membrana celular'], 0, 'Es el ciclo de Calvin.']),
L('ecolog|ecosistema|biodiversidad|ciclos biogeoquimicos|red trofic|piramide|poblacion|sostenib|conservacion de|contaminacion|cambio climatico|invasora', 'Ecología y ambiente',
`• Niveles de organización: individuo, población, comunidad, ecosistema, bioma y biósfera.
• Cadenas y redes tróficas: productores → consumidores → descomponedores. En las pirámides solo se transfiere cerca del 10 % de la energía entre niveles.
• Ciclos biogeoquímicos: agua, carbono (fotosíntesis y respiración), nitrógeno (fijación, nitrificación) y fósforo (sin fase gaseosa).
• Biodiversidad: variedad de especies, genes y ecosistemas. Las especies invasoras desplazan a las nativas.
• Contaminación del agua, aire y suelo; gases de efecto invernadero (CO₂, CH₄); lluvia ácida (SO₂, NOₓ).`,
'ecología ecosistemas ciclos biogeoquímicos', ['¿Qué porcentaje de energía pasa de un nivel trófico al siguiente?', ['90 %', '50 %', '10 %', '1 %'], 2, 'Regla del 10 %.']),
L('logica|conjunto|algebra de boole|proposicional|tabla de verdad|cuantificador|silogismo|deductiv|argumento|booleano|boole|compuerta', 'Lógica proposicional, conjuntos y álgebra de Boole',
`• Conectivos: negación ¬, conjunción ∧ (verdadera si ambas lo son), disyunción ∨ (falsa solo si ambas son falsas), condicional p → q (falso solo si p es V y q es F), bicondicional ↔.
• Equivalencias: ¬(p ∧ q) ≡ ¬p ∨ ¬q (De Morgan); p → q ≡ ¬p ∨ q.
• Conjuntos: unión A ∪ B, intersección A ∩ B, complemento A′, diferencia A − B; |A ∪ B| = |A| + |B| − |A ∩ B|.
• Álgebra de Boole: compuertas AND, OR, NOT, NAND y NOR; se simplifica con leyes y tablas de verdad.`,
'lógica proposicional tablas de verdad conjuntos', ['El condicional p → q es falso solo cuando:', ['p es F y q es V', 'p es V y q es F', 'ambos son F', 'ambos son V'], 1, 'Una verdad no puede implicar una falsedad.']),
L('razonamiento|sucesion|analogia|combinatori|permutacion|probabilidad|serie|patron|acertijo|espacial', 'Razonamiento lógico, sucesiones, conteo y probabilidad',
`• Sucesiones: aritmética (suma una constante), geométrica (multiplica por una constante), de Fibonacci (suma de los dos anteriores), de potencias, alternadas o con varias reglas a la vez.
• Conteo: principio multiplicativo; permutaciones n!; variaciones n!/(n − r)!; combinaciones C(n, r) = n!/(r!(n − r)!).
• Probabilidad: P(A) = casos favorables/casos posibles; P(A ∪ B) = P(A) + P(B) − P(A ∩ B); condicional P(A|B) = P(A ∩ B)/P(B).
• Razonamiento espacial: rotar, reflejar y desarrollar figuras; estrategia: analizar un cambio a la vez.
Ejemplo: de 5 personas se eligen 2 de C(5, 2) = 10 formas.`,
'razonamiento lógico sucesiones combinatoria', ['¿Cuántos comités de 2 personas se forman con 5 candidatos?', ['5', '10', '20', '25'], 1, 'C(5, 2) = 10.']),
L('estadistic|poblacion|muestra|frecuencia|histograma|tendencia central|dispersion|media|mediana', 'Estadística descriptiva',
`• Población: todo el conjunto de interés. Muestra: subconjunto. Variables: cualitativas o cuantitativas (discretas o continuas).
• Tabla de frecuencias: absoluta f, relativa f/n, acumulada y porcentual.
• Media = Σx/n; mediana: valor central ordenado; moda: valor más frecuente.
• Dispersión: rango, varianza s² = Σ(x − media)²/(n − 1), desviación estándar s = √s².
• Gráficos: histograma, polígono de frecuencias y diagrama de caja (Q1, mediana, Q3).
Ejemplo: datos 2, 4, 6, 8 → media 5, mediana 5.`,
'estadística descriptiva media mediana moda', ['Mediana de 3, 5, 7, 9, 11:', ['5', '7', '9', '35'], 1, 'Es el valor central.']),
L('algoritmo|programacion|pseudocodigo|diagrama de flujo|bucle|variable|estructura de control|sistemas de numeracion|binario|computador|ordenador|redes|sistemas operativos|informatica', 'Algoritmos, programación y fundamentos de informática',
`• Algoritmo: secuencia finita de pasos para resolver un problema. Se expresa en pseudocódigo o diagrama de flujo (óvalo = inicio/fin, rombo = decisión, rectángulo = proceso).
• Estructuras: secuencial, condicional (si… entonces… si no), repetitiva (for, while, do-while). Variable: espacio con nombre y tipo (entero, real, texto, lógico).
• Sistemas de numeración: binario (base 2), octal, decimal y hexadecimal. 1011₂ = 8 + 2 + 1 = 11.
• Hardware: CPU, memoria, entradas/salidas. Redes: modelo OSI (7 capas) y TCP/IP.
Ejemplo: suma de 1 a n con un for: s ← 0; para i de 1 a n: s ← s + i.`,
'algoritmos pseudocódigo diagrama de flujo', ['El número binario 1011 equivale en decimal a:', ['9', '10', '11', '13'], 2, '8 + 0 + 2 + 1 = 11.']),
L('ortograf|gramatic|sintaxis|redaccion|acentuacion|puntuacion|vicios del lenguaje|lenguaje|comunicacion|funciones del lenguaje|categorias gramaticales|semantica|normas apa|argumentacion|periodistic|correspondencia', 'Lenguaje: ortografía, gramática y redacción',
`• Acentuación: agudas (acento en la última sílaba, tildan si terminan en n, s o vocal), graves (penúltima, tildan si NO terminan en n, s o vocal) y esdrújulas (siempre tildan).
• Puntuación: la coma separa elementos y vocativos; el punto y coma separa enunciados relacionados; los dos puntos anuncian una enumeración o cita.
• Oración: sujeto y predicado; simple (un verbo) y compuesta (coordinada o subordinada). Categorías: sustantivo, adjetivo, artículo, verbo, adverbio, preposición y conjunción.
• Funciones del lenguaje: referencial, emotiva, apelativa, fática, poética y metalingüística.
• Vicios: solecismo (error de sintaxis), barbarismo (palabra mal usada) y redundancia.
• Redacción: idea principal, coherencia, cohesión y conectores; citas y referencias en formato APA.`,
'ortografía gramática redacción en español', ['«Canción» es una palabra:', ['grave', 'aguda', 'esdrújula', 'sobresdrújula'], 1, 'Acento en la última sílaba y termina en n.']),
L('comprension lectora|lectura|razonamiento verbal|sinonimia|antonimia|metodo cientifico|investigacion|hipotesis|variables dependientes|tecnicas de aprendizaje|literatura|generos literarios', 'Comprensión lectora y método científico',
`• Comprensión lectora: nivel literal (qué dice), inferencial (qué implica) y crítico (qué opino). Estrategia: leer el título, subrayar la idea principal de cada párrafo y resumir.
• Razonamiento verbal: sinónimos, antónimos, analogías (relación A : B :: C : D) y oraciones incompletas.
• Método científico: observación → pregunta → hipótesis → experimentación → análisis → conclusión.
• Variable independiente: la que el investigador modifica. Dependiente: la que se mide. Controladas: las que se mantienen constantes.
• Géneros literarios: narrativo, lírico, dramático y ensayo.`,
'comprensión lectora método científico', ['En un experimento, la variable que se mide como resultado es la:', ['independiente', 'dependiente', 'controlada', 'hipótesis'], 1, 'Depende de lo que se modifica.']),
L('historia de bolivia|prehispanic|virreinato|independencia|republicana|guerra del pacifico|guerra del chaco|guerra del acre|revolucion nacional|dictadura|historia|tiwanaku|incaico|movimiento obrero|movimientos', 'Historia de Bolivia',
`• Época prehispánica: Tiwanaku (cultura altiplánica, cerca del lago Titicaca) y luego el Tahuantinsuyo incaico.
• Colonia: Audiencia de Charcas, parte del Virreinato del Perú; Potosí y su cerro rico (plata). Insurrecciones: Túpac Katari (1781) y Murillo (1809).
• Independencia: 6 de agosto de 1825 (Bolívar y Sucre; Bolivia en honor a Bolívar).
• Siglo XIX: guerra del Pacífico (1879-1884, pérdida del litoral); guerra del Acre (1899-1903, pérdida del Acre).
• Siglo XX: guerra del Chaco (1932-1935, contra Paraguay); Revolución Nacional de 1952 (voto universal, reforma agraria, nacionalización de minas); dictaduras militares y retorno a la democracia en 1982.
• 2009: Constitución del Estado Plurinacional.`,
'historia de Bolivia', ['¿En qué año se fundó la República de Bolivia?', ['1809', '1825', '1879', '1952'], 1, 'El 6 de agosto de 1825.']),
L('constitucion|civica|derechos|estado plurinacional|organizacion del estado|estructura del estado|organizacion funcional del estado|poderes|organos del estado|autonom|educacion ciudadana|democracia|ley \\d|realidad nacional|derecho|cpe|justicia', 'Constitución, Estado y derechos',
`• La Constitución Política del Estado (2009) define a Bolivia como Estado Unitario Social de Derecho Plurinacional Comunitario, descentralizado y con autonomías.
• Órganos del poder público: Ejecutivo, Legislativo (Asamblea Legislativa Plurinacional: Senado y Diputados), Judicial y Electoral.
• Derechos: fundamentales (vida, libertad, igualdad), civiles y políticos, sociales y económicos, colectivos de las naciones y pueblos indígenas originarios. Garantías: acción de libertad, amparo constitucional, protección de privacidad y acción popular.
• Autonomías: departamental, regional, municipal e indígena originaria campesina.
• Derecho: normas jurídicas, morales y sociales; derecho positivo y natural; principios de justicia e igualdad.`,
'Constitución Política del Estado Bolivia 2009', ['¿Qué órgano ejerce el poder Legislativo en Bolivia?', ['Tribunal Supremo', 'Asamblea Legislativa Plurinacional', 'Órgano Electoral', 'Presidencia'], 1, 'Se compone de Senado y Cámara de Diputados.']),
L('filosofia|epistemolog|etica|pensamiento|politic|sociolog|psicolog|pedagog|corrientes|desarrollo humano|escuelas', 'Filosofía, sociología y psicología',
`• Filosofía: ramas principales: lógica, ética, epistemología (teoría del conocimiento), metafísica y estética. Platón (idealismo), Aristóteles (realismo), Descartes (racionalismo), Kant (criticismo).
• Política: Maquiavelo, Hobbes (Leviatán), Locke, Rousseau (contrato social), Montesquieu (separación de poderes).
• Sociología: Comte (positivismo), Durkheim (hecho social), Weber (acción social) y Marx (lucha de clases).
• Psicología: estructuralismo, psicoanálisis (Freud), conductismo (Watson, Skinner), humanismo (Maslow, Rogers) y cognitivismo (Piaget).
• Desarrollo: etapas de Piaget (sensoriomotora, preoperatoria, operaciones concretas y formales) y de Erikson.`,
'filosofía corrientes y psicología general', ['¿Quién propuso la separación de poderes?', ['Hobbes', 'Montesquieu', 'Platón', 'Freud'], 1, 'En El espíritu de las leyes.']),
L('contab|activo|pasivo|patrimonio|libro diario|balance|estados financieros|pcga', 'Contabilidad básica',
`• Ecuación contable: Activo = Pasivo + Patrimonio. Activo: bienes y derechos; Pasivo: obligaciones; Patrimonio: aporte de los dueños más resultados.
• Cuentas: ingresos (aumentan el patrimonio) y gastos (lo disminuyen). Partida doble: cada transacción tiene un débito y un crédito por igual monto.
• Libros: diario (asientos cronológicos) y mayor (por cuenta); balance de comprobación: suma de débitos = suma de créditos.
• Estados financieros: Balance General (situación en una fecha) y Estado de Resultados (ingresos − gastos = utilidad).
Ejemplo: Activo 100 y Pasivo 40 → Patrimonio 60.`,
'contabilidad básica ecuación contable', ['Si el Activo es 100 y el Pasivo 40, el Patrimonio es:', ['140', '60', '40', '100'], 1, 'Patrimonio = Activo − Pasivo.']),
L('econom|oferta|demanda|microeconom|macroeconom|pib|inflacion|desempleo|hacienda|tributaci|presupuesto|comercio|arancel|incoterms|exportacion|planificacion', 'Economía: oferta, demanda e indicadores',
`• Economía: estudia cómo se asignan recursos escasos ante necesidades ilimitadas.
• Demanda: a mayor precio, menor cantidad demandada (ley de la demanda). Oferta: a mayor precio, mayor cantidad ofrecida. El equilibrio es donde se cruzan; elasticidad = % Δ cantidad / % Δ precio.
• Macroeconomía: PIB (valor final de bienes y servicios de un país en un año), inflación (aumento sostenido de precios), desempleo y balanza comercial (exportaciones − importaciones).
• Sector público: Presupuesto General del Estado (ingresos y gastos), impuestos como IVA e IT, y la Ley SAFCO (1178) de control gubernamental.
• Comercio exterior: aranceles, bloques (CAN, MERCOSUR) e Incoterms 2020 (EXW, FOB, CIF).`,
'economía oferta y demanda introducción', ['Si sube el precio de un bien normal, la cantidad demandada:', ['aumenta', 'disminuye', 'no cambia', 'es infinita'], 1, 'Ley de la demanda.']),
L('administracion|marketing|mercadotecnia|empresa|proceso administrativo|4 ps|mezcla|consumidor|publicidad', 'Administración y marketing',
`• Proceso administrativo: planeación, organización, dirección y control.
• La empresa se organiza en áreas funcionales: producción, finanzas, recursos humanos y marketing.
• Marketing: satisfacer necesidades de clientes. Mezcla de las 4 P: Producto, Precio, Plaza (distribución) y Promoción.
• Investigación de mercado: definir el problema, recolectar datos (encuestas, observación), analizar y decidir.
• Margen sobre costo = utilidad/costo; margen sobre venta = utilidad/precio de venta.`,
'administración marketing 4P', ['Las 4 P del marketing son:', ['Producto, Precio, Plaza, Promoción', 'Personas, Procesos, Planes, Pagos', 'Producción, Precio, Política, Presupuesto', 'Producto, Poder, Plaza, Pedido'], 0, 'Es la mezcla clásica de McCarthy.']),
L('geograf|cartograf|latitud|longitud|curvas de nivel|proyeccion|utm|datum|sig|sensores remotos|atmosfera|clima|meteorolog|turismo|astronom|kepler|gravitacion', 'Geografía, cartografía y ciencias de la Tierra',
`• Red geográfica: paralelos (latitud, 0° a 90° N/S desde el Ecuador) y meridianos (longitud, 0° a 180° E/O desde Greenwich).
• Escala: relación entre la distancia en el mapa y en la realidad; 1:50 000 significa que 1 cm = 500 m.
• Curvas de nivel: unen puntos de igual altitud; más juntas = pendiente más fuerte.
• Proyecciones (cilíndrica, cónica, acimutal) y sistemas de coordenadas: geográficas y UTM; datum WGS84.
• Atmósfera: troposfera, estratosfera, mesosfera, termosfera. Clima = promedio de largo plazo; tiempo = estado momentáneo.
• Kepler: órbitas elípticas; ley de gravitación F = G·m₁m₂/r².`,
'cartografía escalas curvas de nivel coordenadas', ['En una escala 1:50 000, 1 cm en el mapa equivale a:', ['50 m', '500 m', '5 km', '50 km'], 1, '50 000 cm = 500 m.']),
L('geologia|tectonic|placas|rocas|mineral|sismic|volcan|tierra|suelo|edafolog|sedimentaci|meteorizacion', 'Geología general',
`• Capas de la Tierra: corteza, manto y núcleo (externo líquido e interno sólido).
• Tectónica de placas: límites divergentes (se separan, dorsales), convergentes (chocan, subducción y orogénesis) y transformantes (deslizan, falla de San Andrés).
• Ciclo de las rocas: ígneas (enfriamiento del magma), sedimentarias (compactación) y metamórficas (presión y temperatura).
• Procesos externos: meteorización, erosión, transporte y sedimentación. Internos: magmatismo, metamorfismo y sismicidad.
• Suelo: horizontes O, A, B, C; pH y materia orgánica determinan su fertilidad.`,
'geología tectónica de placas ciclo de las rocas', ['Una dorsal oceánica es un límite:', ['convergente', 'divergente', 'transformante', 'continental'], 1, 'Las placas se separan.']),
L('dibujo|arte|color|gestalt|composicion|perspectiva|diseno (?:artistico|grafico|bi)|elementos del diseno|proyeccion ortogonal|geometria descriptiva|aptitud|proporcion|tonal|plastic', 'Dibujo, composición y color',
`• Elementos del diseño: punto, línea, plano, volumen, textura y valor (luz y sombra).
• Color: primarios (pigmento: cian, magenta, amarillo), secundarios y terciarios; armonías análogas y complementarias; contraste y psicología del color.
• Gestalt: proximidad, semejanza, cierre, continuidad y figura-fondo.
• Perspectiva: de 1, 2 o 3 puntos de fuga; proyecciones ortogonales (planta, alzado y perfil).
• Proporción del cuerpo humano: la figura mide aproximadamente 7 a 8 cabezas.
• Arte: Renacimiento (Leonardo, Miguel Ángel), Barroco, vanguardias del siglo XX y Barroco Mestizo en Bolivia.`,
'dibujo artístico composición teoría del color', ['La ley de la Gestalt que agrupa elementos por cercanía es:', ['semejanza', 'proximidad', 'cierre', 'continuidad'], 1, 'Por proximidad.']),
L('anatomia|fisiologia humana|homeostasis|morfofunc|sistema (?:cardiovascular|respiratorio|digestivo|nervioso|oseo|muscular|endocrino|excretor|urogenital|linfatico|reproductor)|osteolog|miolog|esplacnolog|histologia|tejido|embriolog|biomecanica|endocrin|nervioso|cardiovascular|digestiv|respiratori', 'Anatomía y fisiología humanas',
`• Planos: sagital, coronal y transversal. Términos: proximal/distal, superior/inferior, anterior/posterior.
• Tejidos: epitelial, conjuntivo, muscular y nervioso.
• Sistemas: óseo (206 huesos en el adulto), muscular, cardiovascular (corazón de 4 cavidades), respiratorio (intercambio en alvéolos), digestivo, nervioso (SNC y SNP), endocrino (hormonas) y excretor (riñón).
• Homeostasis: regulación del medio interno por retroalimentación negativa (temperatura, glucosa, pH).
• Neurona: dendritas, soma y axón; el impulso se transmite como potencial de acción y la sinapsis usa neurotransmisores.`,
'anatomía humana sistemas del cuerpo', ['¿Dónde ocurre el intercambio gaseoso en el pulmón?', ['Bronquios', 'Alvéolos', 'Tráquea', 'Pleura'], 1, 'En los alvéolos pulmonares.']),
L('salud publica|epidemiolog|prevencion|vacuna|promocion de la salud|safci|niveles de atencion|determinantes|saneamiento|indicadores de salud|bioseguridad|cadena de frio|autocuidado|nutricion|alimento|dieta|obesidad|imc', 'Salud pública, epidemiología y nutrición',
`• Niveles de prevención: primaria (evitar la enfermedad: vacunas, higiene), secundaria (diagnóstico temprano) y terciaria (rehabilitación).
• Niveles de atención: 1.º (centros de salud), 2.º (hospitales generales) y 3.er nivel (alta especialidad).
• Epidemiología: cadena epidemiológica (agente, reservorio, transmisión, huésped); indicadores de morbilidad, mortalidad y natalidad; tasa = casos/población × 100 000.
• Modelo SAFCI de Bolivia: salud familiar comunitaria e intercultural.
• Nutrición: macronutrientes (carbohidratos, lípidos, proteínas) y micronutrientes. IMC = peso (kg)/talla² (m²); un IMC de 18,5 a 24,9 es normal.`,
'salud pública epidemiología prevención', ['Una vacuna es una medida de prevención:', ['primaria', 'secundaria', 'terciaria', 'ninguna'], 0, 'Evita que aparezca la enfermedad.']),
L('cristalin|estado solido|silicio|germanio|dopaje|semiconductor|dielectric|metales ferrosos|aleacion|polimero|corrosion|cemento|hidratacion|metales', 'Materiales: sólidos, semiconductores, metales y polímeros',
`• Sólidos cristalinos: átomos ordenados en una red (celda unitaria cúbica simple, centrada en el cuerpo o en las caras); amorfos: sin orden (vidrio).
• Semiconductores: Si y Ge (4 electrones de valencia). Dopaje tipo n (con P o As, sobran electrones) y tipo p (con B o Ga, sobran huecos). La unión p-n es la base del diodo y del transistor.
• Dieléctricos: aislantes que se polarizan en un campo eléctrico (vidrio, polietileno, aire); se usan en condensadores y cables.
• Metales: ferrosos (hierro, acero, fundición) y no ferrosos (cobre, aluminio). El acero es una aleación Fe–C con menos de 2 % de carbono. Los tratamientos térmicos (temple, revenido, recocido) cambian su dureza.
• Corrosión: oxidación electroquímica del metal (4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃). Se previene con pintura, galvanizado o protección catódica.
• Cemento: al hidratarse forma silicatos de calcio hidratados (C–S–H), que le dan resistencia. Polímeros: cadenas largas de monómeros repetidos (polietileno, PVC).`,
'materiales semiconductores aleaciones corrosión química', ['El dopaje tipo n del silicio se hace con elementos que aportan:', ['huecos', 'electrones libres', 'protones', 'neutrones'], 1, 'Fósforo o arsénico tienen 5 electrones de valencia.']),
L('biofisica|palanca|oclusion|radiaciones|rayos x|electroterapeutic|termoterapia|hidroterapia|ultrasonido|biomecanica|hemodinamica|fisica medica', 'Biofísica y física médica',
`• Palancas (1.er, 2.º y 3.er género): según la posición del punto de apoyo, la resistencia y la fuerza. 1.er género: apoyo en medio (cuello). 2.º: resistencia en medio (pie al ponerse de puntillas). 3.º: fuerza en medio (bíceps; es el más común en el cuerpo). Ventaja mecánica = brazo de fuerza/brazo de resistencia.
• Masticación: la mandíbula actúa como palanca; la oclusión es el contacto entre dientes superiores e inferiores.
• Hemodinámica: el flujo sanguíneo Q = ΔP/R; la resistencia aumenta mucho si disminuye el radio del vaso (R ∝ 1/r⁴).
• Radiaciones: los rayos X son radiación electromagnética ionizante; se usa protección con plomo y se minimiza el tiempo de exposición.
• Agentes físicos: termoterapia (calor o frío), hidroterapia (agua), ultrasonido (ondas mecánicas de alta frecuencia) y electroterapia (corrientes eléctricas sobre nervio y músculo).`,
'biofísica palancas del cuerpo humano', ['El bíceps al flexionar el antebrazo actúa como palanca de:', ['1.er género', '2.º género', '3.er género', 'ninguna'], 2, 'La fuerza se aplica entre el apoyo (codo) y la resistencia (mano).']),
L('sistemas agricolas|agroecolog|agricultura|riego|cultivo|fertiliz|desarrollo rural|soberania alimentaria|agraria', 'Sistemas agrícolas y desarrollo rural',
`• Agricultura tradicional: usa semillas locales, trabajo familiar, rotación y descanso de la tierra (aynuqa en el altiplano); es de bajo insumo y alta diversidad.
• Agricultura intensiva: monocultivo, maquinaria, fertilizantes y agroquímicos; rinde más por hectárea pero degrada el suelo si no se maneja.
• Agroecología: aplica principios ecológicos (diversidad, rotación, abonos orgánicos, control biológico) para producir sin deteriorar el ambiente.
• Fertilización: N, P y K son los macronutrientes principales.
• Bolivia: la Ley 1715 (INRA, 1996) y la Ley 3545 (2006) regulan la propiedad agraria; la soberanía alimentaria busca que el país decida qué y cómo produce sus alimentos.`,
'sistemas agrícolas agroecología', ['Los tres macronutrientes principales de un fertilizante son:', ['C, H, O', 'N, P, K', 'Ca, Mg, S', 'Fe, Zn, Cu'], 1, 'Nitrógeno, fósforo y potasio.']),
L('petroleo|gas natural|fluidos de perforacion|yacimiento|roca madre', 'Petróleo y gas natural',
`• Origen: restos orgánicos marinos enterrados que se transforman con presión y temperatura en hidrocarburos en la roca madre.
• Sistema petrolero: roca madre (genera), roca reservorio (almacena; porosa y permeable), roca sello (impide la fuga) y trampa estructural o estratigráfica.
• Gas natural: mezcla rica en metano (CH₄) con etano, propano y butano. El GLP es propano y butano licuados.
• Petróleo crudo: mezcla de alcanos, cicloalcanos y aromáticos; se separa por destilación fraccionada (gasolina, kerosene, diésel, asfalto).
• Caracterización: densidad en grados API, viscosidad y contenido de azufre. Fluidos de perforación (lodos): enfrían la broca, sacan los recortes y equilibran la presión del pozo.`,
'petróleo y gas natural hidrocarburos', ['La roca que impide que el petróleo migre se llama:', ['madre', 'reservorio', 'sello', 'ígnea'], 2, 'La roca sello cierra la trampa.']),
L('neuroanatomia|corteza cerebral|neurobiolog|sistema nervioso central|cerebro|encefalo', 'Neuroanatomía y corteza cerebral',
`• Sistema nervioso central: encéfalo (cerebro, cerebelo y tronco encefálico) y médula espinal. Periférico: nervios y ganglios.
• Lóbulos de la corteza: frontal (planificación, decisiones, lenguaje motor en el área de Broca y movimiento en la corteza motora), parietal (tacto y orientación espacial), temporal (audición, memoria y comprensión del lenguaje en el área de Wernicke), occipital (visión).
• Hemisferios unidos por el cuerpo calloso; la corteza motora controla el lado opuesto del cuerpo.
• Neurona: dendritas reciben, el axón conduce y la sinapsis transmite con neurotransmisores (dopamina, serotonina, acetilcolina).
• Estructuras profundas: tálamo (relé sensorial), hipotálamo (homeostasis), hipocampo (memoria) y amígdala (emociones).`,
'neuroanatomía corteza cerebral lóbulos', ['El lóbulo encargado principalmente de la visión es el:', ['frontal', 'parietal', 'temporal', 'occipital'], 3, 'La corteza visual está en el occipital.']),
];

const PLACEHOLDER = /(El material de estudio detallado será agregado por el profesor|Este módulo cubre el tema|Este módulo cubre|Introducción a .* para el examen de admisión)/;

const GENERICA = `Cómo estudiarlo:
1. Lee la teoría y escribe un resumen de una página con tus palabras.
2. Resuelve al menos 10 ejercicios, de menor a mayor dificultad, y revisa cada error.
3. Repasa con los textos de la bibliografía de esta materia.
4. Mira el video de apoyo y responde la prueba del módulo para medir tu avance.`;

function aplicarContenido(db, opts = {}) {
  const mods = db.prepare(`SELECT m.id, m.title, m.summary, m.content, m.resource_url, s.name AS materia, s.career_id AS cid, c.name AS carrera
    FROM modulos m JOIN materias s ON s.id = m.subject_id JOIN carreras c ON c.id = s.career_id`).all();
  const biblio = new Map(db.prepare("SELECT s.career_id AS cid, m.content FROM modulos m JOIN materias s ON s.id = m.subject_id WHERE m.title = 'Bibliografía recomendada'").all().map(r => [r.cid, r.content]));
  const upd = db.prepare('UPDATE modulos SET content = ?, summary = CASE WHEN summary = \'\' THEN ? ELSE summary END, resource_url = CASE WHEN resource_url = \'\' THEN ? ELSE resource_url END WHERE id = ?');
  const hayQ = db.prepare('SELECT 1 AS x FROM preguntas WHERE module_id = ? LIMIT 1');
  const insQ = db.prepare('INSERT INTO preguntas (module_id, question, options, answer, explanation, position) VALUES (?,?,?,?,?,?)');
  const quizDe = new Map(); let desarrollados = 0, conLeccion = 0, preguntas = 0;
  db.exec('BEGIN');
  try {
    for (const m of mods) {
      if (m.title === 'Bibliografía recomendada') continue;
      const provisional = opts.rehacer ? (m.content.includes('QUÉ DEBES DOMINAR') || m.content.length <= 200) : (!m.content || m.content.length < 160 || PLACEHOLDER.test(m.content));
      if (!provisional) continue;
      const buscar = t => LECCIONES.map(l => ({ l, i: t.search(l.re) })).filter(x => x.i >= 0).sort((a, b) => a.i - b.i).map(x => x.l);
      let lecc = buscar(norm(m.title)); if (!lecc.length) lecc = buscar(norm(m.title + ' ' + m.summary + ' ' + m.materia));
      lecc = lecc.slice(0, 3);
      const temas = m.title.split(/,\s+|;\s+|\.\s+/).map(s => s.trim()).filter(s => s.length > 2).slice(0, 8);
      const partes = [`${m.title}`, `Materia: ${m.materia} · Temario de admisión de ${m.carrera}.`];
      if (lecc.length) {
        conLeccion++;
        partes.push(...lecc.map(l => `▸ ${l.tema.toUpperCase()}\n${l.x}`));
      } else {
        partes.push(`▸ QUÉ DEBES DOMINAR\n${temas.map(t => '• ' + t).join('\n')}\nBusca primero las definiciones, luego las fórmulas o reglas y por último los ejemplos resueltos de cada punto.`);
      }
      partes.push(GENERICA);
      const bib = biblio.get(m.cid);
      if (bib) partes.push(`▸ BIBLIOGRAFÍA DE LA CARRERA (profundiza aquí)\n${bib}`);
      const consulta = (lecc[0] ? lecc[0].v : m.title.slice(0, 80)) + ' explicación clase en español';
      const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(consulta);
      upd.run(partes.join('\n\n'), temas.slice(0, 3).join(', '), url, m.id);
      desarrollados++;
      if (lecc[0] && lecc[0].q && !hayQ.get(m.id)) {
        lecc.filter(l => l.q).slice(0, 2).forEach((l, i) => { insQ.run(m.id, l.q[0], JSON.stringify(l.q[1]), l.q[2], l.q[3], i + 1); preguntas++; });
      }
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return { desarrollados, conLeccion, preguntas };
}
module.exports = { aplicarContenido, LECCIONES };
