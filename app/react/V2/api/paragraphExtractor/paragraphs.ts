import { IncomingHttpHeaders } from 'http';
// import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { PXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';

const johnSmith = {
  _id: '1',
  sharedId: '1',
  title: 'John Smith',
  // document: 'doc_name.pdf',
  language: 'en',
  templateId: '66fbe4f28542cc5545e05a46',
  metadata: [{
    label: 'paragraphCount',
    value: '1',
  }, {
    label: 'text',
    value: 'The quick brown fox jumps over the lazy dog. This sentence is often used as a typing exercise because it contains every letter of the alphabet. However, it lacks the depth and complexity of real-world text samples. To address this limitation, we can expand on the concept by discussing the importance of diverse and representative text samples in natural language processing. Researchers in linguistics and computer science often require large corpora of text data to train and evaluate language models. These datasets must encompass a wide range of topics, writing styles, and linguistic features to ensure that the resulting models can handle the nuances and complexities of human communication effectively.',
  }]
}

const mariaGarcia = {
  _id: '2',
  sharedId: '2',
  title: 'Maria Garcia',
  language: 'en',
  templateId: '66fbe4f28542cc5545e05a46',
  metadata: [
    { label: 'paragraphCount', value: '2' },
    {
      label: 'text',
      value: 'In the realm of artificial intelligence, machine learning algorithms continue to evolve at a rapid pace. Researchers are constantly developing new techniques to improve the accuracy and efficiency of these systems. The potential applications of AI span across various industries, from healthcare to finance. As we delve deeper into the field, we encounter challenges such as ethical considerations, data privacy, and the need for explainable AI. These issues require interdisciplinary collaboration between computer scientists, ethicists, and policymakers to ensure that AI technologies are developed and deployed responsibly. Furthermore, the integration of AI with other emerging technologies like blockchain and the Internet of Things is opening up new possibilities for innovation and disruption across multiple sectors.',
    },
  ],
}

const giuliaRossi = {
  _id: '5',
  sharedId: '5',
  language: 'en',
  title: 'Giulia Rossi',
  // document: 'fifth_doc.pdf',
  templateId: '66fbe4f28542cc5545e05a46',
  metadata: [
    { label: 'paragraphCount', value: '10' },
    {
      label: 'text',
      value: "The human brain remains one of the most complex and fascinating organs in the body. Neuroscientists are continually uncovering new insights into its structure and function. Recent advancements in brain-computer interfaces hold promise for treating neurological disorders and enhancing cognitive abilities. The field of neuroscience has been revolutionized by new imaging technologies, such as functional MRI and optogenetics, which allow researchers to observe and manipulate neural activity with unprecedented precision. These tools have led to breakthroughs in our understanding of memory formation, decision-making processes, and the neural basis of consciousness. Additionally, the study of neuroplasticity has revealed the brain's remarkable ability to adapt and rewire itself in response to experiences and injuries. This knowledge is being applied to develop novel therapies for conditions like stroke, Alzheimer's disease, and depression. As our understanding of the brain deepens, it raises profound questions about the nature of consciousness, free will, and the potential for cognitive enhancement technologies.",
    },
  ],
}

const dummyData: PXEntityParagraphRow[] = [
  {
    sharedId: '1', entities: [johnSmith, {
      ...johnSmith,
      language: 'es',
      metadata: [{
        label: 'paragraphCount',
        value: '1',
      }, {
        label: 'text',
        value: 'El rápido zorro marrón salta sobre el perro perezoso. Esta frase se utiliza a menudo como ejercicio de escritura porque contiene cada letra del alfabeto. Sin embargo, carece de profundidad y complejidad en comparación con muestras de texto del mundo real. Para abordar este problema, podemos expandir el concepto al hablar de la importancia de muestras de texto diversas y representativas en el procesamiento del lenguaje natural. Los investigadores en lingüística y ciencias de la computación a menudo requieren grandes corpora de texto para entrenar y evaluar modelos de lenguaje. Estos conjuntos de datos deben abarcar una amplia gama de temas, estilos de escritura y características lingüísticas para garantizar que los modelos resultantes puedan manejar las sutilezas y complejidades de la comunicación humana de manera efectiva.',
      }]
    }, {
        ...johnSmith,
        language: 'fr',
        metadata: [{
          label: 'paragraphCount',
          value: '1',
        }, {
          label: 'text',
          value: "Le rapide renard marron saute par dessus le chien paresseux. Cette phrase est souvent utilisée comme exercice de rédaction car elle contient chaque lettre de l'alphabet. Cependant, elle manque de profondeur et de complexité par rapport aux échantillons de texte du monde réel. Pour aborder ce problème, nous pouvons élargir le concepte en discutant de l'importance des échantillons de texte divers et représentatifs dans le traitement du langage naturel. Les chercheurs en linguistique et en sciences de l'informatique ont souvent besoin de grands corpus de texte pour entraîner et évaluer les modèles de langage. Ces ensembles de données doivent couvrir une large gamme de sujets, de styles d'écriture et de caractéristiques linguistiques pour garantir que les modèles résultants puissent gérer les nuances et les complexités de la communication humaine de manière efficace.",
        }]
      }
    ]
  },
  {
    sharedId: '2',
    entities: [
      mariaGarcia,
      {
        ...mariaGarcia,
        language: 'es',
        metadata: [
          { label: 'paragraphCount', value: '3' },
          {
            label: 'text',
            value: 'En el ámbito de la inteligencia artificial, los algoritmos de aprendizaje automático continúan evolucionando a un ritmo rápido. Los investigadores están desarrollando constantemente nuevas técnicas para mejorar la precisión y eficiencia de estos sistemas. Las aplicaciones potenciales de la IA abarcan diversas industrias, desde la atención médica hasta las finanzas. A medida que profundizamos en el campo, encontramos desafíos como consideraciones éticas, privacidad de datos y la necesidad de IA explicable. Estos problemas requieren colaboración interdisciplinaria entre científicos computacionales, éticos y legisladores para garantizar que las tecnologías de IA se desarrollen y desplieguen de manera responsable. Además, la integración de la IA con otras tecnologías emergentes como blockchain y el Internet de las Cosas está abriendo nuevas posibilidades para la innovación y la disrupción en múltiples sectores.',
          },
        ],
      },
      {
        ...mariaGarcia,
        language: 'fr',
        metadata: [
          { label: 'paragraphCount', value: '3' },
          {
            label: 'text',
            value: "Le changement climatique reste l'un des problèmes les plus pressants de notre époque. Les scientifiques du monde entier travaillent sans relâche pour comprendre ses impacts et développer des stratégies d'atténuation. Le besoin de pratiques durables et de sources d'énergie renouvelables n'a jamais été aussi urgent. Alors que les températures mondiales continuent d'augmenter, nous assistons à des événements météorologiques extrêmes plus fréquents, à la montée du niveau des mers et à des perturbations des écosystèmes. Cette crise nécessite une approche multifacette, notamment la réduction des émissions de gaz à effet de serre, le développement de technologies de capture du carbone et l'adaptation de nos infrastructures et de notre agriculture à un climat changeant. La coopération internationale et les changements de politique sont cruciaux, car les effets du changement climatique ne respectent pas les frontières nationales. L'éducation et les campagnes de sensibilisation du public jouent également un rôle vital dans la mobilisation des individus et des communautés pour agir et soutenir les politiques environnementales nécessaires.",
          },
        ],
      },
    ],
  },
  {
    sharedId: '5',
    entities: [
      giuliaRossi,
      {
        ...giuliaRossi,
        language: 'es',
        metadata: [
          { label: 'paragraphCount', value: '10' },
          {
            label: 'text',
            value: 'El cerebro humano sigue siendo uno de los órganos más complejos y fascinantes del cuerpo. Los neurocientíficos continúan descubriendo nuevos conocimientos sobre su estructura y función. Los recientes avances en interfaces cerebro-computadora prometen tratar trastornos neurológicos y mejorar las capacidades cognitivas. El campo de la neurociencia ha sido revolucionado por nuevas tecnologías de imagen, como la RMN funcional y la optogenética, que permiten a los investigadores observar y manipular la actividad neuronal con una precisión sin precedentes. Estas herramientas han llevado a avances en nuestra comprensión de la formación de la memoria, los procesos de toma de decisiones y las bases neuronales de la consciencia. Además, el estudio de la neuroplasticidad ha revelado la notable capacidad del cerebro para adaptarse y recablearse en respuesta a experiencias y lesiones. Este conocimiento se está aplicando para desarrollar terapias novedosas para condiciones como el derrame cerebral, la enfermedad de Alzheimer y la depresión. A medida que nuestra comprensión del cerebro se profundiza, surgen preguntas profundas sobre la naturaleza de la consciencia, el libre albedrío y el potencial de las tecnologías de mejora cognitiva.',
          },
        ],
      },
      {
        ...giuliaRossi,
        language: 'fr',
        metadata: [
          { label: 'paragraphCount', value: '10' },
          {
            label: 'text',
            value: "Le cerveau humain reste l'un des organes les plus complexes et fascinants du corps. Les neuroscientifiques continuent de découvrir de nouvelles perspectives sur sa structure et son fonctionnement. Les récents progrès dans les interfaces cerveau-ordinateur sont prometteurs pour le traitement des troubles neurologiques et l'amélioration des capacités cognitives. Le domaine des neurosciences a été révolutionné par de nouvelles technologies d'imagerie, comme l'IRM fonctionnelle et l'optogénétique, qui permettent aux chercheurs d'observer et de manipuler l'activité neuronale avec une précision sans précédent. Ces outils ont conduit à des avancées dans notre compréhension de la formation de la mémoire, des processus de prise de décision et des bases neuronales de la conscience. De plus, l'étude de la neuroplasticité a révélé la remarquable capacité du cerveau à s'adapter et à se recâbler en réponse aux expériences et aux blessures. Ces connaissances sont appliquées pour développer de nouvelles thérapies pour des conditions comme l'accident vasculaire cérébral, la maladie d'Alzheimer et la dépression. À mesure que notre compréhension du cerveau s'approfondit, cela soulève des questions profondes sur la nature de la conscience, du libre arbitre et du potentiel des technologies d'amélioration cognitive.",
          },
        ],
      },
    ],
  },
];


const getByParagraphExtractorId = async (extractorId: string, headers?: IncomingHttpHeaders) => {
  try {
    const requestParams = new RequestParams({ id: extractorId }, headers);
    // const { json: response } = await api.get('paragraphExtraction/entityParagraphs', requestParams);
    const id = requestParams.data?.id;
    return {
      rows: dummyData,
      page: { number: 1, size: 10 },
      totalRows: 2
    };
    // return response;
  } catch (e) {
    return e;
  }
};

export { getByParagraphExtractorId };
