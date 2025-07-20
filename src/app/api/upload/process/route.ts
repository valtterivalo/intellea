/**
 * @fileoverview File upload processing API using OpenAI's native PDF support
 * Exports: POST handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

interface TextContent {
  type: 'text';
  text: string;
}

interface FileContent {
  type: 'file';
  data: Uint8Array;
  mimeType: string;
}

type MessageContent = TextContent | FileContent;

const DOCUMENT_ANALYSIS_PROMPT = `You are a document analyzer. Extract and summarize the key content from this document for knowledge graph creation.

Please provide:
1. A concise summary of the main topic/subject (1-2 sentences)
2. The core concepts, ideas, and themes present in the document
3. Important details, facts, and supporting information
4. Any relationships between different concepts mentioned

Focus on academic, technical, or educational content that would be suitable for creating an interactive knowledge graph. Ignore formatting artifacts, page numbers, headers/footers, and other document metadata.

Respond with clear, well-structured text that captures the document's essential knowledge content.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    let content: string;

    if (file.type === 'application/pdf') {
      // Use OpenAI's native PDF support  
      const fileBuffer = await file.arrayBuffer();
      
      const messageContent: MessageContent[] = [
        {
          type: 'text', 
          text: DOCUMENT_ANALYSIS_PROMPT,
        },
        {
          type: 'file',
          data: new Uint8Array(fileBuffer),
          mimeType: 'application/pdf',
        },
      ];

      const result = await generateText({
        model: openai('gpt-4o'), // Use GPT-4o for PDF processing
        messages: [
          {
            role: 'user',
            content: messageContent,
          },
        ],
      });
      
      content = result.text;
    } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
      // Handle text files directly
      const textContent = await file.text();
      
      const result = await generateText({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'user',
            content: `${DOCUMENT_ANALYSIS_PROMPT}\n\nDocument content:\n\n${textContent}`,
          },
        ],
      });
      
      content = result.text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files, we'll need a simple conversion or ask user to export as PDF
      return NextResponse.json({ 
        error: 'DOCX files are not yet supported. Please export your document as PDF and try again.' 
      }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({ content });
    
  } catch (error) {
    console.error('Document processing error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Processing failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the document' },
      { status: 500 }
    );
  }
}