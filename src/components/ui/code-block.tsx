import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
  className?: string;
}

export const CodeBlock = ({ code, language, fileName, className }: CodeBlockProps) => {
  return (
    <div className={`rounded-lg border bg-muted/50 ${className || ''}`}>
      {fileName && (
        <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">{fileName}</div>
      )}
      <pre className="overflow-x-auto p-4">
        <code className={`text-sm ${language ? `language-${language}` : ''}`}>{code}</code>
      </pre>
    </div>
  );
};
