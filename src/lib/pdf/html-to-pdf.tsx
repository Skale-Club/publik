/**
 * HTML to react-pdf Component Converter
 * Converts TipTap HTML output into styled @react-pdf/renderer components.
 * Supports: h1-h6, p, strong/b, em/i, u, ul, ol, li, blockquote, pre, code, img, hr, br, a
 */

import React from "react"
import { Text, View, Link as PDFLink, Image as PDFImage, StyleSheet } from "@react-pdf/renderer"
import { getBodyFontFamily, getHeadingFontFamily, getCodeFontFamily } from "./font-registration"

type PDFNode = React.ReactElement | string | null

interface ParseContext {
  styles: Record<string, unknown>
}

const baseStyles = StyleSheet.create({
  paragraph: {
    fontFamily: getBodyFontFamily(),
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  heading1: {
    fontFamily: getHeadingFontFamily(),
    fontSize: 24,
    lineHeight: 1.3,
    marginTop: 20,
    marginBottom: 12,
  },
  heading2: {
    fontFamily: getHeadingFontFamily(),
    fontSize: 20,
    lineHeight: 1.3,
    marginTop: 16,
    marginBottom: 10,
  },
  heading3: {
    fontFamily: getHeadingFontFamily(),
    fontSize: 16,
    lineHeight: 1.3,
    marginTop: 14,
    marginBottom: 8,
  },
  heading4: {
    fontFamily: getHeadingFontFamily(),
    fontSize: 14,
    lineHeight: 1.4,
    marginTop: 12,
    marginBottom: 6,
  },
  heading5: {
    fontFamily: getHeadingFontFamily(),
    fontSize: 13,
    lineHeight: 1.4,
    marginTop: 10,
    marginBottom: 6,
  },
  heading6: {
    fontFamily: getHeadingFontFamily(),
    fontSize: 12,
    lineHeight: 1.4,
    marginTop: 10,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecoration: "underline",
  },
  code: {
    fontFamily: getCodeFontFamily(),
    fontSize: 11,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  codeBlock: {
    fontFamily: getCodeFontFamily(),
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: "#f5f5f5",
    padding: 10,
    marginBottom: 8,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#ccc",
    borderLeftStyle: "solid",
    paddingLeft: 10,
    marginBottom: 8,
    fontStyle: "italic",
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 10,
  },
  listBullet: {
    width: 15,
    fontSize: 12,
    fontFamily: getBodyFontFamily(),
  },
  listItemContent: {
    flex: 1,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: getBodyFontFamily(),
  },
  link: {
    color: "#0066cc",
    textDecoration: "underline",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderBottomStyle: "solid",
    marginVertical: 12,
  },
  image: {
    marginBottom: 8,
    maxWidth: "100%",
  },
})

interface Token {
  type: "open" | "close" | "self-closing" | "text"
  tagName?: string
  attributes?: Record<string, string>
  content?: string
}

const SELF_CLOSING = new Set(["br", "hr", "img"])
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"])
const INLINE_TAGS = new Set(["strong", "b", "em", "i", "u", "code", "a", "span"])

function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  const regex = /<(\/?)(\w+)([^>]*)\/?>|([^<]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    if (match[4] !== undefined) {
      const text = match[4]
      if (text.trim() || text.includes("\n")) {
        tokens.push({ type: "text", content: text })
      }
    } else {
      const isClosing = match[1] === "/"
      const tagName = match[2].toLowerCase()
      const attrString = match[3] || ""

      const attributes: Record<string, string> = {}
      const attrRegex = /(\w+)(?:=["']([^"']*)["'])?/g
      let attrMatch: RegExpExecArray | null
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        attributes[attrMatch[1]] = attrMatch[2] ?? "true"
      }

      if (isClosing) {
        tokens.push({ type: "close", tagName })
      } else if (SELF_CLOSING.has(tagName) || attrString.endsWith("/")) {
        tokens.push({ type: "self-closing", tagName, attributes })
      } else {
        tokens.push({ type: "open", tagName, attributes })
      }
    }
  }

  return tokens
}

function buildTree(tokens: Token[], index: { value: number }): PDFNode[] {
  const nodes: PDFNode[] = []

  while (index.value < tokens.length) {
    const token = tokens[index.value]

    if (token.type === "text") {
      index.value++
      const text = token.content?.replace(/\s+/g, " ").trim()
      if (text) {
        nodes.push(text)
      }
      continue
    }

    if (token.type === "self-closing") {
      index.value++
      nodes.push(renderSelfClosing(token.tagName!, token.attributes || {}))
      continue
    }

    if (token.type === "close") {
      index.value++
      break
    }

    if (token.type === "open") {
      const openIndex = index.value
      index.value++
      const children = buildTree(tokens, index)

      if (token.tagName && INLINE_TAGS.has(token.tagName)) {
        nodes.push(renderInline(token.tagName, children, token.attributes || {}))
      } else {
        nodes.push(renderBlock(token.tagName!, children, token.attributes || {}))
      }
      continue
    }

    index.value++
  }

  return nodes
}

function renderSelfClosing(tagName: string, _attributes: Record<string, string>): PDFNode {
  switch (tagName) {
    case "br":
      return "\n"
    case "hr":
      return React.createElement(View, { style: baseStyles.hr })
    case "img":
      return React.createElement(PDFImage, {
        style: baseStyles.image,
        src: _attributes.src || "",
      })
    default:
      return null
  }
}

function renderInline(tagName: string, children: PDFNode[], attributes: Record<string, string>): PDFNode {
  switch (tagName) {
    case "strong":
    case "b":
      return React.createElement(Text, { style: baseStyles.bold }, ...flattenChildren(children))
    case "em":
    case "i":
      return React.createElement(Text, { style: baseStyles.italic }, ...flattenChildren(children))
    case "u":
      return React.createElement(Text, { style: baseStyles.underline }, ...flattenChildren(children))
    case "code":
      return React.createElement(Text, { style: baseStyles.code }, ...flattenChildren(children))
    case "a":
      return React.createElement(
        PDFLink,
        { style: baseStyles.link, src: attributes.href || "#" },
        ...flattenChildren(children)
      )
    case "span":
      return React.createElement(Text, null, ...flattenChildren(children))
    default:
      return flattenChildren(children).length === 1
        ? flattenChildren(children)[0]
        : React.createElement(Text, null, ...flattenChildren(children))
  }
}

function renderBlock(tagName: string, children: PDFNode[], _attributes: Record<string, string>): PDFNode {
  const flatChildren = flattenChildren(children)

  switch (tagName) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = parseInt(tagName[1])
      const styleKey = `heading${level}` as keyof typeof baseStyles
      return React.createElement(Text, { style: baseStyles[styleKey] }, ...flatChildren)
    }
    case "p":
      return React.createElement(Text, { style: baseStyles.paragraph }, ...flatChildren)
    case "blockquote":
      return React.createElement(View, { style: baseStyles.blockquote }, 
        React.createElement(Text, { style: { fontStyle: "italic", fontSize: 12, lineHeight: 1.6 } }, ...flatChildren)
      )
    case "pre":
      return React.createElement(View, { style: baseStyles.codeBlock },
        React.createElement(Text, { style: { fontFamily: getCodeFontFamily(), fontSize: 10 } }, ...flatChildren)
      )
    case "ul":
    case "ol": {
      const isOrdered = tagName === "ol"
      return React.createElement(View, { style: { marginBottom: 8 } },
        ...children.filter(isListItem).map((child, i) => {
          const liChildren = extractListItemText(child)
          return React.createElement(
            View,
            { style: baseStyles.listItem, key: `li-${i}`, wrap: false },
            React.createElement(Text, { style: baseStyles.listBullet }, isOrdered ? `${i + 1}.` : "\u2022"),
            React.createElement(Text, { style: baseStyles.listItemContent }, ...liChildren)
          )
        })
      )
    }
    case "li":
      return React.createElement(View, { style: baseStyles.listItem, wrap: false },
        React.createElement(Text, { style: baseStyles.listBullet }, "\u2022"),
        React.createElement(Text, { style: baseStyles.listItemContent }, ...flatChildren)
      )
    case "div":
    case "section":
    case "article":
      return React.createElement(View, null, ...children.filter(notNull))
    default:
      return flatChildren.length === 1
        ? flatChildren[0]
        : React.createElement(Text, { style: baseStyles.paragraph }, ...flatChildren)
  }
}

function flattenChildren(nodes: PDFNode[]): (string | React.ReactElement)[] {
  const result: (string | React.ReactElement)[] = []
  for (const node of nodes) {
    if (node === null || node === undefined) continue
    if (typeof node === "string") {
      result.push(node)
    } else if (React.isValidElement(node)) {
      result.push(node)
    }
  }
  return result
}

function isListItem(node: PDFNode): boolean {
  if (React.isValidElement(node)) {
    return (node.props as Record<string, unknown>)?.["data-list-item"] === true
  }
  return false
}

function extractListItemText(node: PDFNode): (string | React.ReactElement)[] {
  return flattenChildren([node])
}

function notNull(node: PDFNode): node is string | React.ReactElement {
  return node !== null && node !== undefined
}

export function htmlToPDF(html: string): PDFNode[] {
  if (!html || typeof html !== "string") {
    return [React.createElement(Text, { style: baseStyles.paragraph }, "")]
  }

  const stripped = html.replace(/<\/?p>/gi, "").trim()
  if (!stripped) {
    return [React.createElement(Text, { style: baseStyles.paragraph }, "")]
  }

  const tokens = tokenize(html)
  const index = { value: 0 }
  return buildTree(tokens, index)
}

export function htmlToPDFText(html: string): string {
  if (!html) return ""
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/blockquote>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export { baseStyles as htmlStyles }
