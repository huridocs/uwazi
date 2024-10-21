import { IncomingHttpHeaders } from 'http';
// import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { PXParagraphApiResponse } from 'app/V2/Routes/Settings/ParagraphExtraction/types';

const dummyData = [
  {
    _id: '1',
    title: 'John Smith',
    document: 'doc_name.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 3,
    text: 'The quick brown fox jumps over the lazy dog. This sentence is often used as a typing exercise because it contains every letter of the alphabet. However, it lacks the depth and complexity of real-world text samples. To address this limitation, we can expand on the concept by discussing the importance of diverse and representative text samples in natural language processing. Researchers in linguistics and computer science often require large corpora of text data to train and evaluate language models. These datasets must encompass a wide range of topics, writing styles, and linguistic features to ensure that the resulting models can handle the nuances and complexities of human communication effectively.',
  },
  {
    _id: '2',
    title: 'Maria Garcia',
    document: 'another doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 5,
    text: 'In the realm of artificial intelligence, machine learning algorithms continue to evolve at a rapid pace. Researchers are constantly developing new techniques to improve the accuracy and efficiency of these systems. The potential applications of AI span across various industries, from healthcare to finance. As we delve deeper into the field, we encounter challenges such as ethical considerations, data privacy, and the need for explainable AI. These issues require interdisciplinary collaboration between computer scientists, ethicists, and policymakers to ensure that AI technologies are developed and deployed responsibly. Furthermore, the integration of AI with other emerging technologies like blockchain and the Internet of Things is opening up new possibilities for innovation and disruption across multiple sectors.',
  },
  {
    _id: '3',
    title: 'Pierre Dubois',
    document: 'third_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 2,
    text: 'Climate change remains one of the most pressing issues of our time. Scientists worldwide are working tirelessly to understand its impacts and develop strategies for mitigation. The need for sustainable practices and renewable energy sources has never been more urgent. As global temperatures continue to rise, we are witnessing more frequent extreme weather events, rising sea levels, and disruptions to ecosystems. This crisis requires a multifaceted approach, including reducing greenhouse gas emissions, developing carbon capture technologies, and adapting our infrastructure and agriculture to a changing climate. International cooperation and policy changes are crucial, as the effects of climate change do not respect national borders. Education and public awareness campaigns also play a vital role in mobilizing individuals and communities to take action and support necessary environmental policies.',
  },
  {
    _id: '4',
    title: 'Hans Mueller',
    document: 'fourth_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 4,
    text: 'The field of quantum computing is on the brink of a major breakthrough. Researchers are exploring ways to harness the power of quantum mechanics to solve complex problems that are beyond the capabilities of classical computers. This technology has the potential to revolutionize cryptography, drug discovery, and financial modeling. Quantum computers leverage the principles of superposition and entanglement to perform calculations exponentially faster than traditional computers for certain types of problems. However, significant challenges remain, such as maintaining quantum coherence, reducing error rates, and scaling up the number of qubits. As progress continues, we may soon see practical applications of quantum computing in areas like optimization, machine learning, and simulations of quantum systems. The race to achieve quantum supremacy has sparked intense competition among tech giants and startups alike, driving rapid advancements in both hardware and software development for quantum systems.',
  },
  {
    _id: '5',
    title: 'Giulia Rossi',
    document: 'fifth_doc.pdf',
    languages: ['en', 'es'],
    templateId: '66fbe4f28542cc5545e05a46',
    paragraphCount: 6,
    text: "The human brain remains one of the most complex and fascinating organs in the body. Neuroscientists are continually uncovering new insights into its structure and function. Recent advancements in brain-computer interfaces hold promise for treating neurological disorders and enhancing cognitive abilities. The field of neuroscience has been revolutionized by new imaging technologies, such as functional MRI and optogenetics, which allow researchers to observe and manipulate neural activity with unprecedented precision. These tools have led to breakthroughs in our understanding of memory formation, decision-making processes, and the neural basis of consciousness. Additionally, the study of neuroplasticity has revealed the brain's remarkable ability to adapt and rewire itself in response to experiences and injuries. This knowledge is being applied to develop novel therapies for conditions like stroke, Alzheimer's disease, and depression. As our understanding of the brain deepens, it raises profound questions about the nature of consciousness, free will, and the potential for cognitive enhancement technologies.",
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
