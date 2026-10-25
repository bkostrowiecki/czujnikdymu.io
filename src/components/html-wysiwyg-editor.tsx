"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Form, OverlayTrigger, Tooltip } from "react-bootstrap";

export interface HtmlWysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function HtmlWysiwygEditor({
  value,
  onChange,
  placeholder = "Wpisz treść opisu...",
  minHeight = "200px",
  className = "",
}: HtmlWysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const isUpdatingRef = useRef(false);

  // Sync external value to contentEditable div when value changes externally or when toggling back from HTML mode
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isHtmlMode]);

  const handleToggleMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to Visual: ensure contentEditable receives latest value
      if (editorRef.current) {
        editorRef.current.innerHTML = value || "";
      }
      setIsHtmlMode(false);
    } else {
      // Switching from Visual to HTML: ensure value is synced from innerHTML
      if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        onChange(currentHtml);
      }
      setIsHtmlMode(true);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleAddLink = () => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    const defaultUrl = "https://";
    const url = window.prompt("Podaj adres URL linku:", defaultUrl);
    if (url && url !== defaultUrl) {
      document.execCommand("createLink", false, url);
      handleInput();
    }
  };

  const renderTooltip = (text: string) => <Tooltip id={`tooltip-${text}`}>{text}</Tooltip>;

  return (
    <div className={`border border-secondary rounded-2 overflow-hidden bg-dark ${className}`}>
      {/* Toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 p-2 bg-body-tertiary border-bottom border-secondary">
        <div className="d-flex flex-wrap align-items-center gap-1">
          {/* Text styles */}
          <ButtonGroup size="sm">
            <OverlayTrigger placement="top" overlay={renderTooltip("Pogrubienie (Bold)")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("bold")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-type-bold" />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Kursywa (Italic)")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("italic")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-type-italic" />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Podkreślenie (Underline)")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("underline")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-type-underline" />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Przekreślenie (Strikethrough)")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("strikeThrough")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-type-strikethrough" />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Headings */}
          <ButtonGroup size="sm">
            <OverlayTrigger placement="top" overlay={renderTooltip("Nagłówek H2")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light fw-bold"
                onClick={() => executeCommand("formatBlock", "<h2>")}
                disabled={isHtmlMode}
                type="button"
              >
                H2
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Nagłówek H3")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light fw-bold"
                onClick={() => executeCommand("formatBlock", "<h3>")}
                disabled={isHtmlMode}
                type="button"
              >
                H3
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Zwykły akapit (P)")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("formatBlock", "<p>")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-paragraph" />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Lists */}
          <ButtonGroup size="sm">
            <OverlayTrigger placement="top" overlay={renderTooltip("Lista punktowana")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("insertUnorderedList")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-list-ul" />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Lista numerowana")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("insertOrderedList")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-list-ol" />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Links */}
          <ButtonGroup size="sm">
            <OverlayTrigger placement="top" overlay={renderTooltip("Wstaw link URL")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={handleAddLink}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-link-45deg" />
              </Button>
            </OverlayTrigger>

            <OverlayTrigger placement="top" overlay={renderTooltip("Usuń link")}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="py-1 px-2 text-light"
                onClick={() => executeCommand("unlink")}
                disabled={isHtmlMode}
                type="button"
              >
                <i className="bi bi-slash-circle" />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>

          {/* Clear format */}
          <OverlayTrigger placement="top" overlay={renderTooltip("Wyczyść formatowanie")}>
            <Button
              variant="outline-secondary"
              size="sm"
              className="py-1 px-2 text-light"
              onClick={() => executeCommand("removeFormat")}
              disabled={isHtmlMode}
              type="button"
            >
              <i className="bi bi-eraser" />
            </Button>
          </OverlayTrigger>
        </div>

        {/* Toggle HTML Source mode */}
        <div>
          <Button
            variant={isHtmlMode ? "warning" : "outline-secondary"}
            size="sm"
            className="py-1 px-2 d-flex align-items-center gap-1 small"
            onClick={handleToggleMode}
            type="button"
          >
            <i className="bi bi-code-slash" />
            <span>{isHtmlMode ? "Tryb Wizualny" : "Kod HTML"}</span>
          </Button>
        </div>
      </div>

      {/* Editor Body: Visual Mode */}
      <div
        ref={editorRef}
        contentEditable={!isHtmlMode}
        onInput={handleInput}
        onBlur={handleInput}
        className="p-3 text-light bg-dark focus-ring-0"
        style={{
          display: isHtmlMode ? "none" : "block",
          minHeight,
          maxHeight: "450px",
          overflowY: "auto",
          outline: "none",
          lineHeight: 1.6,
        }}
        data-placeholder={placeholder}
      />

      {/* Editor Body: HTML Code Mode */}
      <Form.Control
        as="textarea"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (editorRef.current) {
            editorRef.current.innerHTML = e.target.value;
          }
        }}
        placeholder="Edytuj czysty kod HTML..."
        className="bg-dark text-light border-0 font-monospace small p-3 rounded-0"
        style={{
          display: isHtmlMode ? "block" : "none",
          minHeight,
          resize: "vertical",
        }}
      />
    </div>
  );
}
