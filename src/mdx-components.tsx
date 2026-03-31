import type { MDXComponents } from 'mdx/types'
import { ContactForm } from './components/contact-form'
import { Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import { SocialMediaLinks } from './components/social-media-links'
import { slugify } from './domain/slugify'
import { JSX, PropsWithChildren } from 'react'
import { stringifyReactNodes } from './domain/stringify-nodes'

const buildHeaderLink = (Tag: keyof JSX.IntrinsicElements) => (props: PropsWithChildren) => {
    if (!props.children) {
      return <h2>{props.children}</h2>
    }

    const str = stringifyReactNodes(props.children);

    const slug = slugify(str);

    return <a href={`#${slug}`} className="header-a"><Tag id={slug}>{props.children}</Tag></a>
  }

const components = {
  ContactForm,
  SocialMediaLinks,
  Form,
  Col,
  Row,
  Card,
  CardBody,
  h1: buildHeaderLink("h1"),
  h2: buildHeaderLink("h2"),
  h3: buildHeaderLink("h3"),
  h4: buildHeaderLink("h4"),
  h5: buildHeaderLink("h5"),
  h6: buildHeaderLink("h6"),
} satisfies MDXComponents
 
export function useMDXComponents(): MDXComponents {
  return components
}
