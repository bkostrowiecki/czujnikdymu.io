import { PropsWithChildren, ReactNode, isValidElement } from 'react'

export function stringifyReactNodes(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(stringifyReactNodes).join('')
  }

  if (isValidElement(node)) {
    return stringifyReactNodes((node.props as PropsWithChildren).children)
  }

  if (typeof node === 'object' && Symbol.iterator in node) {
    return Array.from(node as Iterable<ReactNode>)
      .map(stringifyReactNodes)
      .join('')
  }

  return ''
}
