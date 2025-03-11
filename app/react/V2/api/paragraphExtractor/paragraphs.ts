import { IncomingHttpHeaders } from 'http';
// import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { PXParagraphApiResponse } from 'app/V2/Routes/Settings/ParagraphExtraction/types';

const dummyData = [
  {
    _id: '1',
    title: 'John Smith',
    document: 'doc_name.pdf',
    languages: ['en', 'es', 'fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 1,
    versions: {
      en: 'The quick brown fox jumps over the lazy dog. This sentence is often used as a typing exercise because it contains every letter of the alphabet. However, it lacks the depth and complexity of real-world text samples. To address this limitation, we can expand on the concept by discussing the importance of diverse and representative text samples in natural language processing. Researchers in linguistics and computer science often require large corpora of text data to train and evaluate language models. These datasets must encompass a wide range of topics, writing styles, and linguistic features to ensure that the resulting models can handle the nuances and complexities of human communication effectively.',
      es: 'El rápido zorro marrón salta sobre el perro perezoso. Esta frase se utiliza a menudo como ejercicio de escritura porque contiene cada letra del alfabeto. Sin embargo, carece de profundidad y complejidad en comparación con muestras de texto del mundo real. Para abordar este problema, podemos expandir el concepto al hablar de la importancia de muestras de texto diversas y representativas en el procesamiento del lenguaje natural. Los investigadores en lingüística y ciencias de la computación a menudo requieren grandes corpora de texto para entrenar y evaluar modelos de lenguaje. Estos conjuntos de datos deben abarcar una amplia gama de temas, estilos de escritura y características lingüísticas para garantizar que los modelos resultantes puedan manejar las sutilezas y complejidades de la comunicación humana de manera efectiva.',
      fr: "Le rapide renard marron saute par dessus le chien paresseux. Cette phrase est souvent utilisée comme exercice de rédaction car elle contient chaque lettre de l'alphabet. Cependant, elle manque de profondeur et de complexité par rapport aux échantillons de texte du monde réel. Pour aborder ce problème, nous pouvons élargir le concepte en discutant de l'importance des échantillons de texte divers et représentatifs dans le traitement du langage naturel. Les chercheurs en linguistique et en sciences de l'informatique ont souvent besoin de grands corpus de texte pour entraîner et évaluer les modèles de langage. Ces ensembles de données doivent couvrir une large gamme de sujets, de styles d'écriture et de caractéristiques linguistiques pour garantir que les modèles résultants puissent gérer les nuances et les complexités de la communication humaine de manière efficace.",
    },
  },
  {
    _id: '2',
    title: 'Maria Garcia',
    document: 'another doc.pdf',
    languages: ['en', 'es', 'fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 2,
    versions: {
      en: 'In the realm of artificial intelligence, machine learning algorithms continue to evolve at a rapid pace. Researchers are constantly developing new techniques to improve the accuracy and efficiency of these systems. The potential applications of AI span across various industries, from healthcare to finance. As we delve deeper into the field, we encounter challenges such as ethical considerations, data privacy, and the need for explainable AI. These issues require interdisciplinary collaboration between computer scientists, ethicists, and policymakers to ensure that AI technologies are developed and deployed responsibly. Furthermore, the integration of AI with other emerging technologies like blockchain and the Internet of Things is opening up new possibilities for innovation and disruption across multiple sectors.',
      es: 'En el ámbito de la inteligencia artificial, los algoritmos de aprendizaje automático continúan evolucionando a un ritmo rápido. Los investigadores están desarrollando constantemente nuevas técnicas para mejorar la precisión y eficiencia de estos sistemas. Las aplicaciones potenciales de la IA abarcan diversas industrias, desde la atención médica hasta las finanzas. A medida que profundizamos en el campo, encontramos desafíos como consideraciones éticas, privacidad de datos y la necesidad de IA explicable. Estos problemas requieren colaboración interdisciplinaria entre científicos computacionales, éticos y legisladores para garantizar que las tecnologías de IA se desarrollen y desplieguen de manera responsable. Además, la integración de la IA con otras tecnologías emergentes como blockchain y el Internet de las Cosas está abriendo nuevas posibilidades para la innovación y la disrupción en múltiples sectores.',
      fr: "Dans le domaine de l'intelligence artificielle, les algorithmes d'apprentissage automatique continuent d'évoluer à un rythme rapide. Les chercheurs développent constamment de nouvelles techniques pour améliorer la précision et l'efficacité de ces systèmes. Les applications potentielles de l'IA s'étendent à diverses industries, des soins de santé à la finance. En approfondissant le domaine, nous rencontrons des défis tels que les considérations éthiques, la confidentialité des données et le besoin d'IA explicable. Ces problèmes nécessitent une collaboration interdisciplinaire entre informaticiens, éthiciens et décideurs politiques pour garantir que les technologies d'IA soient développées et déployées de manière responsable. De plus, l'intégration de l'IA avec d'autres technologies émergentes comme la blockchain et l'Internet des objets ouvre de nouvelles possibilités d'innovation et de disruption dans de multiples secteurs.",
    },
  },
  {
    _id: '3',
    title: 'Pierre Dubois',
    document: 'third_doc.pdf',
    languages: ['en', 'es', 'fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 3,
    versions: {
      en: 'Climate change remains one of the most pressing issues of our time. Scientists worldwide are working tirelessly to understand its impacts and develop strategies for mitigation. The need for sustainable practices and renewable energy sources has never been more urgent. As global temperatures continue to rise, we are witnessing more frequent extreme weather events, rising sea levels, and disruptions to ecosystems. This crisis requires a multifaceted approach, including reducing greenhouse gas emissions, developing carbon capture technologies, and adapting our infrastructure and agriculture to a changing climate. International cooperation and policy changes are crucial, as the effects of climate change do not respect national borders. Education and public awareness campaigns also play a vital role in mobilizing individuals and communities to take action and support necessary environmental policies.',
      es: 'El cambio climático sigue siendo uno de los problemas más apremiantes de nuestro tiempo. Los científicos de todo el mundo trabajan incansablemente para comprender sus impactos y desarrollar estrategias de mitigación. La necesidad de prácticas sostenibles y fuentes de energía renovable nunca ha sido más urgente. A medida que las temperaturas globales continúan aumentando, estamos presenciando eventos climáticos extremos más frecuentes, el aumento del nivel del mar y alteraciones en los ecosistemas. Esta crisis requiere un enfoque multifacético, que incluye reducir las emisiones de gases de efecto invernadero, desarrollar tecnologías de captura de carbono y adaptar nuestra infraestructura y agricultura a un clima cambiante. La cooperación internacional y los cambios en las políticas son cruciales, ya que los efectos del cambio climático no respetan las fronteras nacionales. La educación y las campañas de concientización pública también juegan un papel vital en la movilización de individuos y comunidades para tomar acción y apoyar las políticas ambientales necesarias.',
      fr: "Le changement climatique reste l'un des problèmes les plus pressants de notre époque. Les scientifiques du monde entier travaillent sans relâche pour comprendre ses impacts et développer des stratégies d'atténuation. Le besoin de pratiques durables et de sources d'énergie renouvelables n'a jamais été aussi urgent. Alors que les températures mondiales continuent d'augmenter, nous assistons à des événements météorologiques extrêmes plus fréquents, à la montée du niveau des mers et à des perturbations des écosystèmes. Cette crise nécessite une approche multifacette, notamment la réduction des émissions de gaz à effet de serre, le développement de technologies de capture du carbone et l'adaptation de nos infrastructures et de notre agriculture à un climat changeant. La coopération internationale et les changements de politique sont cruciaux, car les effets du changement climatique ne respectent pas les frontières nationales. L'éducation et les campagnes de sensibilisation du public jouent également un rôle vital dans la mobilisation des individus et des communautés pour agir et soutenir les politiques environnementales nécessaires.",
    },
  },
  {
    _id: '4',
    title: 'Hans Mueller',
    document: 'fourth_doc.pdf',
    languages: ['en', 'es', 'fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 4,
    versions: {
      en: 'The field of quantum computing is on the brink of a major breakthrough. Researchers are exploring ways to harness the power of quantum mechanics to solve complex problems that are beyond the capabilities of classical computers. This technology has the potential to revolutionize cryptography, drug discovery, and financial modeling. Quantum computers leverage the principles of superposition and entanglement to perform calculations exponentially faster than traditional computers for certain types of problems. However, significant challenges remain, such as maintaining quantum coherence, reducing error rates, and scaling up the number of qubits. As progress continues, we may soon see practical applications of quantum computing in areas like optimization, machine learning, and simulations of quantum systems. The race to achieve quantum supremacy has sparked intense competition among tech giants and startups alike, driving rapid advancements in both hardware and software development for quantum systems.',
      es: 'El campo de la computación cuántica está al borde de un gran avance. Los investigadores están explorando formas de aprovechar el poder de la mecánica cuántica para resolver problemas complejos que están más allá de las capacidades de las computadoras clásicas. Esta tecnología tiene el potencial de revolucionar la criptografía, el descubrimiento de fármacos y el modelado financiero. Las computadoras cuánticas aprovechan los principios de superposición y entrelazamiento para realizar cálculos exponencialmente más rápidos que las computadoras tradicionales para ciertos tipos de problemas. Sin embargo, persisten desafíos significativos, como mantener la coherencia cuántica, reducir las tasas de error y aumentar el número de qubits. A medida que el progreso continúa, pronto podríamos ver aplicaciones prácticas de la computación cuántica en áreas como la optimización, el aprendizaje automático y las simulaciones de sistemas cuánticos. La carrera por lograr la supremacía cuántica ha desencadenado una intensa competencia entre gigantes tecnológicos y startups por igual, impulsando rápidos avances en el desarrollo tanto de hardware como de software para sistemas cuánticos.',
      fr: "Le domaine de l'informatique quantique est à l'aube d'une avancée majeure. Les chercheurs explorent des moyens d'exploiter la puissance de la mécanique quantique pour résoudre des problèmes complexes qui dépassent les capacités des ordinateurs classiques. Cette technologie a le potentiel de révolutionner la cryptographie, la découverte de médicaments et la modélisation financière. Les ordinateurs quantiques utilisent les principes de superposition et d'intrication pour effectuer des calculs exponentiellement plus rapides que les ordinateurs traditionnels pour certains types de problèmes. Cependant, des défis importants subsistent, comme le maintien de la cohérence quantique, la réduction des taux d'erreur et l'augmentation du nombre de qubits. Au fur et à mesure des progrès, nous pourrions bientôt voir des applications pratiques de l'informatique quantique dans des domaines comme l'optimisation, l'apprentissage automatique et les simulations de systèmes quantiques. La course à la suprématie quantique a déclenché une concurrence intense entre les géants de la technologie et les startups, stimulant des avancées rapides dans le développement matériel et logiciel des systèmes quantiques.",
    },
  },
  {
    _id: '5',
    title: 'Giulia Rossi',
    document: 'fifth_doc.pdf',
    languages: ['en', 'es', 'fr'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 10,
    versions: {
      en: "The human brain remains one of the most complex and fascinating organs in the body. Neuroscientists are continually uncovering new insights into its structure and function. Recent advancements in brain-computer interfaces hold promise for treating neurological disorders and enhancing cognitive abilities. The field of neuroscience has been revolutionized by new imaging technologies, such as functional MRI and optogenetics, which allow researchers to observe and manipulate neural activity with unprecedented precision. These tools have led to breakthroughs in our understanding of memory formation, decision-making processes, and the neural basis of consciousness. Additionally, the study of neuroplasticity has revealed the brain's remarkable ability to adapt and rewire itself in response to experiences and injuries. This knowledge is being applied to develop novel therapies for conditions like stroke, Alzheimer's disease, and depression. As our understanding of the brain deepens, it raises profound questions about the nature of consciousness, free will, and the potential for cognitive enhancement technologies.",
      es: 'El cerebro humano sigue siendo uno de los órganos más complejos y fascinantes del cuerpo. Los neurocientíficos continúan descubriendo nuevos conocimientos sobre su estructura y función. Los recientes avances en interfaces cerebro-computadora prometen tratar trastornos neurológicos y mejorar las capacidades cognitivas. El campo de la neurociencia ha sido revolucionado por nuevas tecnologías de imagen, como la RMN funcional y la optogenética, que permiten a los investigadores observar y manipular la actividad neuronal con una precisión sin precedentes. Estas herramientas han llevado a avances en nuestra comprensión de la formación de la memoria, los procesos de toma de decisiones y las bases neuronales de la consciencia. Además, el estudio de la neuroplasticidad ha revelado la notable capacidad del cerebro para adaptarse y recablearse en respuesta a experiencias y lesiones. Este conocimiento se está aplicando para desarrollar terapias novedosas para condiciones como el derrame cerebral, la enfermedad de Alzheimer y la depresión. A medida que nuestra comprensión del cerebro se profundiza, surgen preguntas profundas sobre la naturaleza de la consciencia, el libre albedrío y el potencial de las tecnologías de mejora cognitiva.',
      fr: "Le cerveau humain reste l'un des organes les plus complexes et fascinants du corps. Les neuroscientifiques continuent de découvrir de nouvelles perspectives sur sa structure et son fonctionnement. Les récents progrès dans les interfaces cerveau-ordinateur sont prometteurs pour le traitement des troubles neurologiques et l'amélioration des capacités cognitives. Le domaine des neurosciences a été révolutionné par de nouvelles technologies d'imagerie, comme l'IRM fonctionnelle et l'optogénétique, qui permettent aux chercheurs d'observer et de manipuler l'activité neuronale avec une précision sans précédent. Ces outils ont conduit à des avancées dans notre compréhension de la formation de la mémoire, des processus de prise de décision et des bases neuronales de la conscience. De plus, l'étude de la neuroplasticité a révélé la remarquable capacité du cerveau à s'adapter et à se recâbler en réponse aux expériences et aux blessures. Ces connaissances sont appliquées pour développer de nouvelles thérapies pour des conditions comme l'accident vasculaire cérébral, la maladie d'Alzheimer et la dépression. À mesure que notre compréhension du cerveau s'approfondit, cela soulève des questions profondes sur la nature de la conscience, du libre arbitre et du potentiel des technologies d'amélioration cognitive.",
    },
  },
] as PXParagraphApiResponse[];

// const apiEndpoint = 'paragraph-extractor-paragraph';

const getByParagraphExtractorId = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
    // const { json: response } = await api.get(apiEndpoint, requestParams);
    const id = requestParams.data?.id;
    return dummyData || id;
    // return response;
  } catch (e) {
    return e;
  }
};

export { getByParagraphExtractorId };
