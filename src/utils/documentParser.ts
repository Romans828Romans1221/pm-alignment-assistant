import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  fileName: string;
  fileType: string;
}

export const parseDocument = async (file: File): Promise<ParsedDocument> => {
  const fileType = file.name.split('.').pop()?.toLowerCase() || '';
  const fileName = file.name;

  if (fileType === 'txt') {
    const text = await file.text();
    return { text, fileName, fileType };
  }

  if (fileType === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value, fileName, fileType };
  }

  if (fileType === 'pdf') {
    const text = await extractPdfText(file);
    return { text, fileName, fileType };
  }

  throw new Error('Unsupported file type. Please upload a PDF, Word document, or text file.');
};

const extractPdfText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Use pdf.js to extract text
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
};